import logging
import mysql.connector
from fastapi import HTTPException
from app.config import PASSWORD_RE
from app.state import state

logger = logging.getLogger(__name__)

def get_conn():
    """Lấy kết nối từ connection pool."""
    return state.db_pool.get_connection()


def get_user_id(cursor, username: str) -> int:
    """Trả về user_id hoặc raise HTTP 404."""
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Username không tồn tại")
        
    if isinstance(row, dict):
        return row.get("id")
    return row[0]


def validate_password(password: str):
    """Raise HTTP 400 nếu mật khẩu không đủ mạnh."""
    if not PASSWORD_RE.match(password):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải từ 9-15 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)",
        )


# ── DB Initialization (gọi 1 lần khi startup) ────────────────────────────────

def init_db():
    """Tạo bảng nếu chưa có, migrate an toàn nếu thiếu cột."""
    conn   = get_conn()
    cursor = conn.cursor()
    try:
        # 1. Bảng tài khoản người dùng chính (Đồng bộ chuẩn cột password_hash)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                username      VARCHAR(50) UNIQUE NOT NULL,
                password      VARCHAR(255) NOT NULL,
                email         VARCHAR(255) NULL,
                phone         VARCHAR(12) NULL,
                role          ENUM('user', 'admin') DEFAULT 'user',
                is_premium    TINYINT(1) DEFAULT 0,
                premium_until DATETIME NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 2. Bảng lưu lịch sử các lần bấm nút AI dự đoán nguy cơ tim mạch
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS prediction_history (
                id                INT AUTO_INCREMENT PRIMARY KEY,
                user_id           INT,
                username          VARCHAR(255),
                name_prediction   VARCHAR(255),
                prediction_result INT,
                clinical_score    FLOAT,
                probability       FLOAT,
                risk_level        VARCHAR(50),
                timestamp         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')

        # 3. Bảng lưu ngữ cảnh trò chuyện với Chatbot AI (Llama) để tư vấn sức khỏe
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chatbot_history (
                id        INT AUTO_INCREMENT PRIMARY KEY,
                user_id   INT,
                role      ENUM('user','assistant') NOT NULL,
                content   TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        # 4. Bảng lưu thông tin chỉ số sinh học cơ bản trong hồ sơ cá nhân
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_information (
                id                INT AUTO_INCREMENT PRIMARY KEY,
                user_id           INT UNIQUE NOT NULL,
                age               INT NULL,
                sex               TINYINT NULL,      -- 0: Nữ, 1: Nam
                height            FLOAT NULL,
                weight            FLOAT NULL,
                blood_pressure    INT NULL,          -- Huyết áp lúc nghỉ (trestbps)
                cholesterol       INT NULL,          -- Cholesterol (chol)
                created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        logger.info("Toàn bộ cơ sở dữ liệu hệ thống AI cá nhân đã sẵn sàng")
        
    except Exception as e:
        logger.error(f"Khởi tạo cơ sở dữ liệu thất bại: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()