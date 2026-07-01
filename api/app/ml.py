"""
ml.py
"""
from typing import Optional, Tuple
import pandas as pd
from app.state import state

def calculate_bmi(height: float, weight: float) -> Optional[float]:
    """Tính toán chỉ số BMI tự động."""
    if height and weight and height > 0:
        return round(weight / (height / 100) ** 2, 1)
    return None

def get_risk_level(probability: float) -> str:
    """Trả về nhãn chuỗi risk_level duy nhất khớp chính xác cấu trúc DB."""
    if probability <= 0.3:
        return "THẤP"
    elif probability <= 0.6:
        return "TRUNG BÌNH"
    elif probability <= 0.8:
        return "CAO"
    return "RẤT CAO"

def calculate_clinical_score(data: dict) -> float:
    """Tính điểm lâm sàng dựa trên các chỉ số cốt lõi của tim mạch."""
    points = 0
    if data.get("age", 0) > 60:    points += 3
    elif data.get("age", 0) > 45:  points += 1
    
    if data.get("trestbps", 0) > 160: points += 3
    elif data.get("trestbps", 0) > 140: points += 1
    
    if data.get("chol", 0) > 240: points += 1
    if data.get("exang") == 1:    points += 2
    
    if data.get("oldpeak", 0.0) > 2.0:  points += 2
    elif data.get("oldpeak", 0.0) > 1.0: points += 1
    
    return round(min(points / 12, 1.0), 4)

def build_feature_dict(d: dict, bmi_value: Optional[float], model_features: list) -> dict:
    """Map cấu trúc dữ liệu từ client Pydantic sang cấu trúc đặc trưng của mô hình AI."""
    raw_mapped = {
        "age":                       d["age"],
        "sex":                       d["sex"],
        "trestbps":                  d["trestbps"],
        "chol":                      d["chol"],
        "fbs":                       d["fbs"],
        "thalch":                    d["thalch"],
        "exang":                     d["exang"],
        "oldpeak":                   d["oldpeak"],
        "ca_missing":                d["ca_missing"],
        "thal_missing":              d["thal_missing"],
        "cp_atypical angina":        d["cp_atypical_angina"],
        "cp_non-anginal":            d["cp_non_anginal"],
        "cp_typical angina":         d["cp_typical_angina"],
        "restecg_normal":            d["restecg_normal"],
        "restecg_st-t abnormality":  d["restecg_st_t_abnormality"],
        "slope_flat":                d["slope_flat"],
        "slope_upsloping":           d["slope_upsloping"],
        "dataset_Hungary":           d["dataset_Hungary"],
        "dataset_Switzerland":       d["dataset_Switzerland"],
        "dataset_VA Long Beach":     d["dataset_VA_Long_Beach"],
        "age__40":                   d["age_under_40"],
        "bp_age_ratio":              d["bp_age_ratio"],
    }
    # Chỉ giữ lại các đặc trưng thực sự nằm trong danh sách train của mô hình AI
    return {feat: raw_mapped[feat] for feat in model_features if feat in raw_mapped}

def run_inference(model, scaler, feature_dict: dict, feature_names: list) -> Tuple[int, float]:
    """Chạy suy luận trực tiếp thông qua mô hình đã được tải vào State."""
    df = pd.DataFrame([feature_dict])[feature_names]
    scaled = scaler.transform(df)
    
    prediction = int(model.predict(scaled)[0])
    probability = float(model.predict_proba(scaled)[0][prediction])
    return prediction, probability