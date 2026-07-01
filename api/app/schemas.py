"""
schemas.py
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ── Auth / User ───────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username:         str
    password:         str
    confirm_password: str
    email:            Optional[str] = None
    phone:            Optional[str] = None

class PasswordChange(BaseModel):
    new_password: str

class PremiumStatusResponse(BaseModel):
    username:      str
    is_premium:    bool
    chat_limit:    int
    premium_until: Optional[datetime] = None

class ProfileUpdateInput(BaseModel):
    age:            Optional[int]   = Field(None, ge=0, le=120)
    sex:            Optional[int]   = Field(None, ge=0, le=1)
    height:         Optional[float] = Field(None, ge=50, le=250)
    weight:         Optional[float] = Field(None, ge=10, le=300)
    blood_pressure: Optional[int]   = Field(None, ge=50, le=250)
    cholesterol:    Optional[int]   = Field(None, ge=100, le=600)

# ── Prediction ────────────────────────────────────────────────────────────────
class PredictionInput(BaseModel):
    age:                      float = Field(..., ge=0, le=120)
    sex:                      int   = Field(..., ge=0, le=1)
    trestbps:                 float = Field(..., ge=50, le=250)
    chol:                     float = Field(..., ge=50, le=600)
    thalch:                   float = Field(..., ge=50, le=250)
    oldpeak:                  float = Field(..., ge=0, le=10)
    fbs:                      int   = Field(0, ge=0, le=1)
    exang:                    int   = Field(0, ge=0, le=1)
    cp_asymptomatic:          int   = Field(0, ge=0, le=1)
    ca_missing:               int   = Field(0, ge=0, le=1)
    thal_missing:             int   = Field(0, ge=0, le=1)
    cp_atypical_angina:       int   = Field(0, ge=0, le=1)
    cp_non_anginal:           int   = Field(0, ge=0, le=1)
    cp_typical_angina:        int   = Field(0, ge=0, le=1)
    restecg_normal:           int   = Field(0, ge=0, le=1)
    restecg_st_t_abnormality: int   = Field(0, ge=0, le=1)
    slope_flat:               int   = Field(0, ge=0, le=1)
    slope_upsloping:          int   = Field(0, ge=0, le=1)
    dataset_Hungary:          int   = Field(0, ge=0, le=1)
    dataset_Switzerland:      int   = Field(0, ge=0, le=1)
    dataset_VA_Long_Beach:    int   = Field(0, ge=0, le=1)
    age_under_40:             int   = Field(0, ge=0, le=1)
    bp_age_ratio:             float = Field(0.0)
    height:                   Optional[float] = Field(None, ge=50,  le=250)
    weight:                   Optional[float] = Field(None, ge=10,  le=300)
    include_bmi:              bool  = Field(False)


class AIDetails(BaseModel):
    probability: float
    risk_level: str
    message: str

class ClinicalDetails(BaseModel):
    probability: float
    risk_level: str
    message: str

class PredictionOutput(BaseModel):
    ai_prediction: AIDetails
    clinical_evaluation: ClinicalDetails
    prediction: int
    bmi: Optional[float] = None


class SaveHistoryInput(BaseModel):
    name_prediction:   str
    prediction_result: int
    clinical_score:    float
    probability:       float
    risk_level:        str

# ── Chatbot ───────────────────────────────────────────────────────────────────
class ChatMessageInput(BaseModel):
    message: str

class ChatMessageOutput(BaseModel):
    reply: str

ChatInput = ChatMessageInput
ChatOutput = ChatMessageOutput