"""
routers/chatbot.py
------------------
Các route liên quan đến Chatbot AI (GROQ):
  POST /chatbot          – Gửi tin nhắn và nhận tư vấn từ AI
  GET  /chatbot/history  – Lấy lịch sử trò chuyện
  GET  /user/chat-status – Kiểm tra số lượt chat còn lại trong giờ
"""
import json
import logging
import re
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.config import GROQ_API_KEY, GROQ_MODEL
from app.database import get_conn, get_user_id
from app.ml import (
    build_feature_dict,
    calculate_clinical_score,
    get_risk_level,
    run_inference,
)
from app.schemas import ChatInput
from app.state import state

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Chatbot"])

# Giới hạn số request mỗi giờ cho mỗi user
HOURLY_LIMIT = 20

_GROQ_HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}


# ── Helper: gọi GROQ ──────────────────────────────────────────────────────────

async def _call_groq(messages: list, json_mode: bool = False, timeout: int = 10) -> str:
    """Gọi GROQ API và trả về nội dung text từ choices[0]."""
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.0 if json_mode else 0.7,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=_GROQ_HEADERS,
            json=payload,
        )
        r.raise_for_status()

    return r.json()["choices"][0]["message"]["content"]


def _parse_groq_json(raw: str) -> dict:
    """Parse JSON từ response GROQ, fallback về action=ask nếu lỗi."""
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"action": "ask", "reply": raw}


@router.post("/chatbot")
async def chat_with_ai(data: ChatInput, current_user: str = Depends(get_current_user)):
    """Chatbot thông minh tích hợp mô hình ML dự đoán nguy cơ tim mạch và tư vấn linh hoạt."""
    if not state.groq_ready:
        raise HTTPException(
            status_code=503,
            detail="Chatbot chưa sẵn sàng. Vui lòng cấu hình GROQ_API_KEY hợp lệ trong file .env.",
        )

    conn = get_conn()
    cursor = conn.cursor()
    try:
        user_id = get_user_id(cursor, current_user)

        # Kiểm tra giới hạn 20 request/giờ
        cursor.execute(
            """SELECT COUNT(*) FROM chatbot_history
               WHERE user_id = %s AND role = 'user'
               AND timestamp >= NOW() - INTERVAL 1 HOUR""",
            (user_id,),
        )
        used_this_hour = cursor.fetchone()[0]

        if used_this_hour >= HOURLY_LIMIT:
            logger.warning("User %s đã đạt giới hạn %d request/giờ", current_user, HOURLY_LIMIT)
            return {
                "limit_reached": True,
                "reply": f"⚠️ Bạn đã sử dụng hết {HOURLY_LIMIT} lượt chat miễn phí trong 1 giờ qua. Vui lòng quay lại sau nhé!",
            }

        # Lưu tin nhắn của user
        cursor.execute(
            "INSERT INTO chatbot_history (user_id, role, content) VALUES (%s, %s, %s)",
            (user_id, "user", data.message),
        )
        conn.commit()

        # Lấy lịch sử 10 tin nhắn gần nhất để làm ngữ cảnh hội thoại
        cursor.execute(
            """SELECT role, content FROM chatbot_history
               WHERE user_id = %s ORDER BY timestamp DESC LIMIT 10""",
            (user_id,),
        )
        history_text = "\n".join(
            f"{'Người dùng' if role == 'user' else 'Trợ lý'}: {content}"
            for role, content in reversed(cursor.fetchall())
        )

        pred_ctx = ""
        if data.latest_result:
            prob = data.latest_result.get("probability", 0)
            risk = data.latest_result.get("risk_level", "Không xác định")
            pred_ctx = f"\n[Kết quả dự đoán màn hình chính: Nguy cơ {risk}, xác suất {round(prob * 100, 1)}%]\n"

        # Bước 1: Gọi GROQ bóc tách thông số y tế (JSON mode)
        extract_prompt = f"""Bạn là trợ lý y tế chuyên về tim mạch. Phân tích tin nhắn của người dùng.
Các thông số cần để dự đoán bệnh tim:
- age: tuổi (số)
- sex: giới tính (1=nam, 0=nữ)
- trestbps: huyết áp tâm thu lúc nghỉ (mmHg)
- chol: cholesterol (mg/dL)
- fbs: đường huyết lúc đói > 120 mg/dL (1=có, 0=không)
- thalch: nhịp tim tối đa đạt được (bpm)
- exang: đau ngực khi gắng sức (1=có, 0=không)
- oldpeak: độ chênh ST (số thực)

Lịch sử hội thoại:
{history_text}
{pred_ctx}

Hãy trả lời ĐÚNG theo 1 trong 2 định dạng JSON (tuyệt đối không viết thêm ngoài JSON):
Nếu CHƯA đủ thông số:
{{"action": "ask", "reply": "<câu hỏi thân thiện bằng tiếng Việt>"}}
Nếu ĐỦ thông số:
{{"action": "predict", "params": {{"age": <số>, "sex": <0|1>, "trestbps": <số>, "chol": <số>, "fbs": <0|1>, "thalch": <số>, "exang": <0|1>, "oldpeak": <số>}}}}"""

        raw = await _call_groq(
            messages=[
                {"role": "system", "content": "Bạn là trợ lý y tế chuyên nghiệp. Bạn bắt buộc phải phản hồi bằng một JSON Object duy nhất."},
                {"role": "user", "content": extract_prompt},
            ],
            json_mode=True,
        )
        parsed = _parse_groq_json(raw)
        action = parsed.get("action", "ask")

        # Bước 2: Xử lý khi đã thu thập đủ thông số lâm sàng
        result_data = None
        if action == "predict" and "params" in parsed:
            params = parsed["params"]
            age = float(params.get("age", 45))
            trestbps = float(params.get("trestbps", 120))

            pred_input = {
                "age": age,
                "sex": int(params.get("sex", 1)),
                "trestbps": trestbps,
                "chol": float(params.get("chol", 200)),
                "fbs": int(params.get("fbs", 0)),
                "thalch": float(params.get("thalch", 150)),
                "exang": int(params.get("exang", 0)),
                "oldpeak": float(params.get("oldpeak", 0.0)),
                "ca_missing": 1, "thal_missing": 1,
                "cp_atypical_angina": 0, "cp_non_anginal": 0, "cp_typical_angina": 0,
                "restecg_normal": 1, "restecg_st_t_abnormality": 0,
                "slope_flat": 0, "slope_upsloping": 0,
                "dataset_Hungary": 0, "dataset_Switzerland": 0, "dataset_VA_Long_Beach": 0,
                "age_under_40": 1 if age < 40 else 0,
                "bp_age_ratio": trestbps / max(age, 1),
                "include_bmi": False,
            }

            prediction, probability = run_inference(build_feature_dict(pred_input))
            risk_level, _ = get_risk_level(probability)
            clinical_score = calculate_clinical_score(pred_input)

            try:
                cursor.execute(
                    """INSERT INTO prediction_history
                       (user_id, name_prediction, prediction_result, clinical_score, probability, risk_level)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (user_id, f"CHAT_{uuid.uuid4().hex[:6]}", prediction, clinical_score, probability, risk_level),
                )
                conn.commit()
            except Exception:
                logger.warning("Không thể lưu kết quả dự đoán từ Chatbot vào DB.")

            # GROQ lần 2: Tạo lời tư vấn dựa trên tính cách mới và các nguyên tắc bắt buộc
            gender_str = "Nam" if pred_input["sex"] == 1 else "Nữ"
            system_prompt = f"""Bạn là một Bác sĩ Trợ lý AI chuyên về tim mạch tên là HeartBot.
Tính cách: Thân thiện, thấu hiểu, đôi lúc dí dỏm, hài hước một cách duyên dáng để giảm bớt lo lắng cho bệnh nhân, nhưng khi đưa ra lời khuyên chuyên môn phải rõ ràng, dễ hiểu.

Vừa có kết quả đánh giá nguy cơ tim mạch từ mô hình Machine Learning:
- Kết quả mô hình: {"CÓ nguy cơ bệnh tim" if prediction == 1 else "KHÔNG có nguy cơ cao"}
- Mức độ nguy cơ: {risk_level}
- Chỉ số cụ thể: Tuổi {pred_input["age"]}, {gender_str}, Huyết áp {pred_input["trestbps"]} mmHg, Cholesterol {pred_input["chol"]} mg/dL, Nhịp tim tối đa {pred_input["thalch"]} bpm.

Dưới đây là lịch sử cuộc hội thoại để bạn nắm bắt ngữ cảnh hiện tại (tránh lặp lại câu từ máy móc):
{history_text}

Hãy viết phản hồi trò chuyện bằng tiếng Việt gửi cho bệnh nhân theo các nguyên tắc bắt buộc sau:
1. Tuyệt đối KHÔNG nhắc lại toàn bộ báo cáo kết quả cũ một cách rập khuôn, máy móc nếu người dùng chỉ hỏi tiếp, nhận xét ngắn hoặc trò chuyện thêm. Hãy linh hoạt đối đáp theo ngữ cảnh câu hỏi mới nhất.
2. Thông báo kết quả ban đầu rõ ràng, lồng ghép văn phong dí dỏm, tự nhiên để trấn an tinh thần bệnh nhân.
3. Giải thích ngắn gọn ý nghĩa các chỉ số và đưa ra 3-4 lời khuyên cụ thể về lối sống hoặc dinh dưỡng.
4. Nhắc nhở ân cần rằng đây là đánh giá AI, nên đi khám bác sĩ chuyên khoa.
5. Không tiết lộ chi tiết kỹ thuật về mô hình hay xác suất, chỉ tập trung vào lời khuyên hữu ích cho người dùng.
6. Hãy giữ thái độ tích cực nhằm giảm bớt lo lắng về sức khỏe tim mạch cho người dùng.
7. Tránh sử dụng thuật ngữ y khoa phức tạp, hãy dùng ngôn ngữ đơn giản và dễ hiểu nhất có thể.
9. Không nói những lời phản cảm hoặc gây hoang mang cho người dùng. Hãy luôn giữ thái độ tích cực và hỗ trợ."""

            ai_reply = await _call_groq(
                messages=[
                    {"role": "system", "content": "Bạn là bác sĩ tim mạch AI tư vấn sức khỏe thông minh, duyên dáng và linh hoạt."},
                    {"role": "user", "content": system_prompt},
                ],
                timeout=30,
            )

            result_data = {
                "prediction": int(prediction),
                "probability": round(probability, 4),
                "risk_level": risk_level,
                "clinical_score": round(clinical_score, 4),
            }
        else:
            ai_reply = parsed.get("reply", "Bạn có thể vui lòng cung cấp thêm thông tin về tuổi hoặc huyết áp không?")

        # Lưu phản hồi của AI vào database
        cursor.execute(
            "INSERT INTO chatbot_history (user_id, role, content) VALUES (%s, %s, %s)",
            (user_id, "assistant", ai_reply),
        )
        conn.commit()

        response = {"reply": ai_reply}
        if result_data:
            response["prediction"] = result_data
        return response

    except HTTPException:
        raise
    except Exception:
        logger.exception("Lỗi xử lý Chatbot Cloud AI")
        raise HTTPException(status_code=500, detail="Lỗi xử lý hệ thống Chatbot")
    finally:
        cursor.close()
        conn.close()


@router.get("/chatbot/history")
async def get_chat_history(current_user: str = Depends(get_current_user)):
    """Lấy toàn bộ lịch sử tin nhắn chatbot của user."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT role, content FROM chatbot_history
               WHERE user_id = (SELECT id FROM users WHERE username = %s)
               ORDER BY timestamp ASC""",
            (current_user,),
        )
        return [{"role": row[0], "content": row[1]} for row in cursor.fetchall()]
    except Exception:
        logger.exception("Lỗi lấy lịch sử chat của user %s", current_user)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống không thể tải lịch sử cuộc trò chuyện")
    finally:
        cursor.close()
        conn.close()


@router.get("/user/chat-status")
async def get_chat_status(current_user: str = Depends(get_current_user)):
    """Trả về số lượt chat đã dùng và còn lại trong 1 giờ qua."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        user_id = get_user_id(cursor, current_user)
        cursor.execute(
            """SELECT COUNT(*) FROM chatbot_history
                WHERE user_id = %s AND role = 'user'
                AND timestamp >= NOW() - INTERVAL 1 HOUR""",
            (user_id,),
        )
        used_this_hour = cursor.fetchone()[0]

        return {
            "username":    current_user,
            "used":        used_this_hour,
            "limit":       HOURLY_LIMIT,
            "remaining":   max(0, HOURLY_LIMIT - used_this_hour),
            "reset_info":  "Giới hạn được tính trong cửa sổ 1 giờ trượt (rolling window).",
        }
    except Exception:
        logger.exception("Lỗi lấy trạng thái chat của user %s", current_user)
        raise HTTPException(status_code=500, detail="Lỗi hệ thống chatbot")
    finally:
        cursor.close()
        conn.close()