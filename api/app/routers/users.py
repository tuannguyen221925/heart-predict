"""
routers/users.py
"""
import logging
import bcrypt
import mysql.connector
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.auth import create_token, get_current_user
from app.config import EMAIL_RE
from app.database import get_conn, validate_password, get_user_id
from app.schemas import PasswordChange, RegisterRequest, ProfileUpdateInput

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Users"])


@router.post("/register", status_code=201)
async def register_user(body: RegisterRequest):
    """Đăng ký tài khoản mới."""
    if body.password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Mật khẩu xác nhận không khớp")
    if body.phone and len(body.phone) > 12:
        raise HTTPException(status_code=400, detail="Số điện thoại không hợp lệ (tối đa 12 ký tự)")
    if body.email and len(body.email) > 255:
        raise HTTPException(status_code=400, detail="Email quá dài")

    conn = get_conn()
    cursor = conn.cursor()
    try:
        # Kiểm tra trùng lặp tập trung bằng 1 câu truy vấn tối ưu
        cursor.execute(
            "SELECT username, email, phone FROM users WHERE username = %s OR email = %s OR (phone IS NOT NULL AND phone = %s) LIMIT 1",
            (body.username, body.email, body.phone)
        )
        existing = cursor.fetchone()
        if existing:
            if existing[0] == body.username:
                raise HTTPException(status_code=400, detail="Username đã tồn tại")
            if existing[1] == body.email:
                raise HTTPException(status_code=400, detail="Email đã tồn tại")
            raise HTTPException(status_code=400, detail="Số điện thoại đã tồn tại")

        validate_password(body.password)
        hashed = bcrypt.hashpw(body.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Insert user mới
        cursor.execute(
            "INSERT INTO users (username, password, email, phone) VALUES (%s, %s, %s, %s)",
            (body.username, hashed, body.email, body.phone),
        )
        user_id = cursor.lastrowid

        # Khởi tạo bản ghi rỗng bên hồ sơ sức khỏe user_information
        cursor.execute("INSERT INTO user_information (user_id) VALUES (%s)", (user_id,))
        
        conn.commit()
        return {"status": "success", "message": "Đăng ký thành công"}
    finally:
        cursor.close()
        conn.close()


@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    """Đăng nhập bằng OAuth2 chuẩn hóa."""
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        # Chỉ SELECT những trường cần dùng (id, password) để giảm tải RAM mạng
        cursor.execute("SELECT id, password FROM users WHERE username = %s LIMIT 1", (form_data.username,))
        user = cursor.fetchone()

        if not user or not bcrypt.checkpw(form_data.password.encode('utf-8'), user['password'].encode('utf-8')):
                    raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không đúng")

        access_token = create_token(form_data.username, role="user")
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        cursor.close()
        conn.close()


@router.get("/information/me", tags=["User Profile"])
async def get_user_profile(current_user: str = Depends(get_current_user)):
    """Lấy thông tin hồ sơ sức khỏe cá nhân."""
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = get_user_id(cursor, current_user)
        # Chỉ định danh cụ thể các trường sinh học để tăng hiệu năng tối đa
        cursor.execute(
            "SELECT age, sex, height, weight, blood_pressure, cholesterol FROM user_information WHERE user_id = %s LIMIT 1",
            (user_id,)
        )
        profile = cursor.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ người dùng.")
        return profile
    finally:
        cursor.close()
        conn.close()


@router.put("/user/profile", tags=["User Profile"])
async def update_user_profile(profile_data: ProfileUpdateInput, current_user: str = Depends(get_current_user)):
    """Cập nhật thông tin sinh học động bằng Prepared Statement."""
    conn = get_conn()
    cursor = conn.cursor()
    try:
        user_id = get_user_id(cursor, current_user)
        update_dict = profile_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            return {"message": "Không có thông tin nào thay đổi."}
            
        fields = [f"{key} = %s" for key in update_dict.keys()]
        query = f"UPDATE user_information SET {', '.join(fields)} WHERE user_id = %s"
        values = list(update_dict.values()) + [user_id]
        
        cursor.execute(query, tuple(values))
        conn.commit()
        return {"message": "Cập nhật hồ sơ sức khỏe thành công"}
    finally:
        cursor.close()
        conn.close()