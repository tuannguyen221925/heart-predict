# Frontend-Backend Schema Fixes (422 Error Resolution)

## Problem
Backend was returning **422 Unprocessable Content** error because the frontend payload didn't match the backend's `PredictionInput` schema.

## Root Causes & Fixes

### 1. ✅ Field Name Mismatch
**Issue**: Frontend sent `block_name_prediction` but backend expects `name_prediction`
**Fix**: 
- Updated FormData interface to use `name_prediction` instead of `block_name_prediction`
- Updated default form data initialization
- Updated form input reference from `formData.block_name_prediction` to `formData.name_prediction`

### 2. ✅ Age Field Naming
**Issue**: Frontend sent multiple age variants (`age_duoi_40`, `age_40_50`, `age_50_60`, `age_tren_60`, plus `_1` and `_2` variants) but backend only expects `age_under_40`
**Fix**: 
- Simplified `getAgeBinning()` function to return only `age_under_40` field
- Removed unnecessary age variants that caused validation errors

### 3. ✅ Extra Fields in Payload
**Issue**: Frontend sent `risk_score` and `risk_score_binary` fields that backend doesn't accept
**Fix**:
- Removed these fields from the payload
- Backend computes these internally, they should not be in the input

### 4. ✅ BMI Field Handling
**Issue**: Frontend always set `include_bmi: true` even when height/weight weren't provided
**Fix**:
- Changed to conditional: `include_bmi: !!(formData.height && formData.weight)`
- Only set true when both height and weight are provided

## Backend Schema Validation
The backend `PredictionInput` now correctly validates:

```python
class PredictionInput(BaseModel):
    name_prediction: str                    # ✅ Now correctly sent
    age: float
    sex: int
    trestbps: float
    chol: float
    fbs: int
    thalch: float
    exang: int
    oldpeak: float
    ca_missing: int
    thal_missing: int
    cp_atypical_angina: int
    cp_non_anginal: int
    cp_typical_angina: int
    restecg_normal: int
    restecg_st_t_abnormality: int
    slope_flat: int
    slope_upsloping: int
    dataset_Hungary: int
    dataset_Switzerland: int
    dataset_VA_Long_Beach: int
    age_under_40: int                      # ✅ Only this age field
    bp_age_ratio: float
    height: Optional[float]
    weight: Optional[float]
    include_bmi: bool
```

## Testing
- Build completed successfully: ✅
- All TypeScript validations pass: ✅
- Payload structure now matches backend schema: ✅
- Dev server running and ready for testing: ✅

## Debug Output
Console logs added to verify payload:
```javascript
console.log("[v0] Sending payload:", JSON.stringify(payload, null, 2));
console.log("[v0] Response status:", response.status);
console.log("[v0] Response data:", data);
```

These can be removed after testing.
