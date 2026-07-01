"""
auth.py
"""
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.config import JWT_ALGORITHM, JWT_EXPIRE_MIN, JWT_SECRET

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def create_token(username: str, role: str = "user") -> str:
    """Tạo JWT access token chuẩn hóa có kèm vai trò (role)."""
    # Sử dụng timezone.utc tường minh tránh lệch múi giờ hệ thống khi Deploy
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN)
    payload = {"sub": username, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """Xác thực Bearer token và trả về username, chặn token giả mạo."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise ValueError("Missing sub claim")
        return username
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )