"""
config.py
"""
import os
import re
from dotenv import load_dotenv

load_dotenv()

# ── Database ─────────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

# ── GROQ Cloud AI ─────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ── Chatbot Limits ────────────────────────────────────────────────────────────
FREE_CHAT_LIMIT    = int(os.getenv("FREE_CHAT_LIMIT", "10"))
PREMIUM_CHAT_LIMIT = int(os.getenv("PREMIUM_CHAT_LIMIT", "20"))

# ── JWT Auth ──────────────────────────────────────────────────────────────────
JWT_SECRET     = os.getenv("JWT_SECRET_KEY", "heartguard_secret_2026")
JWT_ALGORITHM  = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", 60))

# ── ML Model Paths ────────────────────────────────────────────────────────────
MODEL_DIR     = os.getenv("MODEL_DIR", r"E:\heart predict\models")
MODEL_PATH    = os.path.join(MODEL_DIR, "random_forest_model.pkl")
FEATURES_PATH = os.path.join(MODEL_DIR, "feature_names.pkl")
SCALER_PATH   = os.path.join(MODEL_DIR, "heart_scaler.pkl")

# ── Validation Regex ──────────────────────────────────────────────────────────
PASSWORD_RE = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,15}$')
EMAIL_RE    = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS_STR = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,https://heart-predict-wheat.vercel.app",
)
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_STR.split(",") if o.strip()]