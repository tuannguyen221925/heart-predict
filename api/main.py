"""
main.py
"""
import logging
import os
from contextlib import asynccontextmanager

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector.pooling import MySQLConnectionPool

from app.config import (
    ALLOWED_ORIGINS,
    DB_CONFIG,
    FEATURES_PATH,
    GROQ_API_KEY,
    GROQ_MODEL,
    MODEL_PATH,
    SCALER_PATH,
)
from app.database import init_db
from app.routers.chatbot     import router as chatbot_router
from app.routers.predictions import router as predictions_router
from app.routers.users       import router as users_router
from app.state import state

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Hệ thống AI Dự đoán Tim mạch đang khởi động...")

    for label, path in [("Model", MODEL_PATH), ("Scaler", SCALER_PATH), ("Features", FEATURES_PATH)]:
        if not os.path.exists(path):
            logger.critical("❌ Không tìm thấy %s tại: %s. Hệ thống dừng.", label, path)
            raise FileNotFoundError(f"Missing {label} file.")

    try:
        state.model         = joblib.load(MODEL_PATH)
        state.scaler        = joblib.load(SCALER_PATH)
        # SỬA LẠI ĐÂY: Gán chính xác vào state.feature_names để đồng bộ dữ liệu
        state.feature_names = joblib.load(FEATURES_PATH) 
        logger.info("✅ ML Artifacts loaded thành công (%d features)", len(state.feature_names))
    except Exception as e:
        logger.critical("❌ Lỗi nạp ML Artifacts: %s", str(e))
        raise e

    try:
        state.db_pool = MySQLConnectionPool(pool_name="mypool", pool_size=5, **DB_CONFIG)
        logger.info("✅ Database connection pool khởi tạo thành công")
        init_db()
        logger.info("✅ Cơ sở dữ liệu ứng dụng cá nhân đã sẵn sàng")
    except Exception as e:
        logger.critical("❌ Kết nối Database thất bại: %s", str(e))
        raise e

    if GROQ_API_KEY and GROQ_API_KEY.startswith("gsk_"):
        state.groq_ready = True
        logger.info("✅ GROQ Cloud AI đã sẵn sàng | Model: %s", GROQ_MODEL)
    else:
        state.groq_ready = False
        logger.warning("⚠️  GROQ_API_KEY không hợp lệ — Chatbot tư vấn sẽ tạm khóa.")

    yield

    logger.info("👋 Đang đóng kết nối và dừng hệ thống...")


app = FastAPI(
    title="Heart Disease Prediction API",
    description="API chuẩn đoán nguy cơ bệnh tim mạch dựa trên mô hình học máy",
    version="3.0",
    lifespan=lifespan,
)

if ALLOWED_ORIGINS and ALLOWED_ORIGINS[0] == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(users_router)
app.include_router(predictions_router)
app.include_router(chatbot_router)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if state.db_pool else "error",
        "ml_model": "loaded" if state.model else "error",
        "ml_features": "loaded" if state.feature_names else "error",
        "chatbot_ai": "ready" if state.groq_ready else "disabled"
    }