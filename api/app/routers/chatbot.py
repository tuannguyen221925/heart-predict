"""
routers/chatbot.py
"""
import json
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.database import get_conn, get_user_id
from app.schemas import ChatInput
from app.state import state

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Chatbot"])

HOURLY_LIMIT = 20
_GROQ_HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

async def _call_groq(messages: list) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API Key chưa được cấu hình.")
    
    payload = {"model": GROQ_MODEL, "messages": messages, "temperature": 0.3}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=_GROQ_HEADERS,
                json=payload,
                timeout=12
            )
            if response.status_code != 200:
                logger.error(f"Groq error {response.status_code}: {response.text}")
                raise HTTPException(status_code=502, detail="Lỗi kết nối từ dịch vụ AI trí tuệ nhân tạo")
            
            res_json = response.json()
            return res_json["choices"][0]["message"]["content"]
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="AI phản hồi quá lâu, vui lòng thử lại.")

@router.post("/chatbot")
async def chat_with_bot(body: ChatInput, current_user: str = Depends(get_current_user)):
    """Gửi tin nhắn và nhận phản hồi tư vấn sức khỏe thông minh từ Llama-3."""
    if not state.groq_ready:
        raise HTTPException(status_code=503, detail="Dịch vụ AI Chatbot hiện đang bảo trì")

    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = get_user_id(cursor, current_user)

        # 1. Kiểm tra giới hạn rate limit cực nhanh
        cursor.execute(
            "SELECT COUNT(*) as count FROM chatbot_history WHERE user_id = %s AND role = 'user' AND timestamp >= NOW() - INTERVAL 1 HOUR",
            (user_id,)
        )
        if cursor.fetchone()["count"] >= HOURLY_LIMIT:
            raise HTTPException(status_code=429, detail="Bạn đã dùng hết 20 lượt tư vấn/giờ. Vui lòng đợi thêm.")

        # 2. Thu thập lịch sử trò chuyện (Chỉ lấy 15 câu gần nhất để tối ưu chi phí Token & Tốc độ mạng)
        cursor.execute(
            "SELECT role, content FROM chatbot_history WHERE user_id = %s ORDER BY timestamp DESC LIMIT 15",
            (user_id,)
        )
        history_rows = cursor.fetchall()
        history_rows.reverse() # Sắp xếp lại từ cũ đến mới cho AI đọc

        # Xây dựng Prompt hệ thống chuyên gia y tế
        messages = [{
            "role": "system",
            "content": "Bạn là một trợ lý AI chuyên về tư vấn phòng ngừa bệnh tim mạch. Hãy trả lời ngắn gọn, thân thiện, mang tính khoa học và luôn khuyên người dùng đi khám bác sĩ khi có dấu hiệu nặng."
        }]
        for row in history_rows:
            messages.append({"role": row["role"], "content": row["content"]})
        
        messages.append({"role": "user", "content": body.message})

        # 3. Gọi Groq Cloud API
        ai_response = await _call_groq(messages)

        # 4. Lưu đồng thời cả câu hỏi của user và câu trả lời của AI vào DB
        cursor.execute("INSERT INTO chatbot_history (user_id, role, content) VALUES (%s, 'user', %s)", (user_id, body.message))
        cursor.execute("INSERT INTO chatbot_history (user_id, role, content) VALUES (%s, 'assistant', %s)", (user_id, ai_response))
        conn.commit()

        return {"response": ai_response}
    finally:
        cursor.close()
        conn.close()

@router.get("/chatbot/history")
async def get_chat_history(current_user: str = Depends(get_current_user)):
    """Lấy toàn bộ lịch sử trò chuyện để hiển thị lên khung chat của Client."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        user_id = get_user_id(cursor, current_user)
        cursor.execute(
            "SELECT role, content FROM chatbot_history WHERE user_id = %s ORDER BY timestamp ASC",
            (user_id,),
        )
        return [{"role": r[0], "content": r[1]} for r in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()

@router.get("/user/chat-status")
async def get_chat_status(current_user: str = Depends(get_current_user)):
    """Kiểm tra số lượt chat còn lại trong giờ của user."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        user_id = get_user_id(cursor, current_user)
        cursor.execute(
            "SELECT COUNT(*) FROM chatbot_history WHERE user_id = %s AND role = 'user' AND timestamp >= NOW() - INTERVAL 1 HOUR",
            (user_id,),
        )
        used_this_hour = cursor.fetchone()[0]
        return {
            "username":   current_user,
            "used":       used_this_hour,
            "limit":      HOURLY_LIMIT,
            "remaining":  max(0, HOURLY_LIMIT - used_this_hour),
        }
    finally:
        cursor.close()
        conn.close()