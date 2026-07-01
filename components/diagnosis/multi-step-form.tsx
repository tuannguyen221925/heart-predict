"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
  Loader2,
  Heart,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
  Stethoscope,
} from "lucide-react";
import { ResultDisplay } from "./result-display";
import HeartChatbot from "../chatbot/HeartChatbot";
interface ResultDetail {
  probability: number;
  risk_level: string;
  message: string;
}

interface PredictionResult {
  ai_prediction: ResultDetail;
  clinical_evaluation: ResultDetail;
  prediction: number;
  bmi: number | null;
}

interface FormData {
  age: string;
  sex: string;
  height: string;
  weight: string;
  trestbps: string;
  chol: string;
  thalch: string;
  oldpeak: string;
  fbs: string;
  exang: string;
  cp: string;
  restecg: string;
  slope: string;
  name_prediction: string;
}

const defaultFormData: FormData = {
  age: "",
  sex: "1",
  height: "",
  weight: "",
  trestbps: "",
  chol: "",
  thalch: "",
  oldpeak: "",
  fbs: "0",
  exang: "0",
  cp: "asymptomatic",
  restecg: "normal",
  slope: "flat",
  name_prediction: "",
};

export function MultiStepDiagnosisForm() {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const totalSteps = 3;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getAgeBinning = (age: number) => ({ age_under_40: age < 40 ? 1 : 0 });

  const mapChestPain = (cp: string) => ({
    cp_typical_angina: cp === "typical_angina" ? 1 : 0,
    cp_atypical_angina: cp === "atypical_angina" ? 1 : 0,
    cp_non_anginal: cp === "non_anginal" ? 1 : 0,
  });

  const mapRestEcg = (restecg: string) => ({
    restecg_normal: restecg === "normal" ? 1 : 0,
    restecg_st_t_abnormality: restecg === "st_t_abnormality" ? 1 : 0,
  });

  const mapSlope = (slope: string) => ({
    slope_flat: slope === "flat" ? 1 : 0,
    slope_upsloping: slope === "upsloping" ? 1 : 0,
  });

  // ── HÀM SUBMIT DỮ LIỆU ĐÃ ĐƯỢC TỐI ƯU HÓA TOÀN DIỆN ──
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    // 1. Chọc localStorage rút mã Token thông hành ra
    const token = localStorage.getItem("access_token");

    try {
      const ageNum = parseFloat(formData.age);
      const bpNum = parseFloat(formData.trestbps);
      
      const payload = {
        age: ageNum,
        sex: formData.sex === "1" ? 1 : 0,
        trestbps: bpNum,
        chol: parseFloat(formData.chol),
        fbs: parseInt(formData.fbs),
        thalch: parseFloat(formData.thalch),
        exang: parseInt(formData.exang),
        oldpeak: parseFloat(formData.oldpeak),
        ...mapChestPain(formData.cp),
        ...mapRestEcg(formData.restecg),
        ...mapSlope(formData.slope),
        bp_age_ratio: bpNum / ageNum,
        include_bmi: true,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        ...getAgeBinning(ageNum),
        ca_missing: 0,
        thal_missing: 0,
        dataset_Hungary: 0,
        dataset_Switzerland: 0,
        dataset_VA_Long_Beach: 0,
        risk_score: 0,
        risk_score_binary: 0,
        block_name_prediction: formData.name_prediction || "default"
      };

      // 2. CHUẨN HÓA URL: Bỏ tham số ?username= thừa vì Backend mới tự trích xuất qua Token JWT
      const url = API_ENDPOINTS.predict || "/api/predict";
      
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // ── ĐÂY LÀ DÒNG CHÍ MẠNG XÓA LỖI 401 UNAUTHORIZED ──
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      // Bắt lỗi Token không hợp lệ hoặc hết hạn ngay tại Client
      if (response.status === 401) {
        setError(
          language === "vi"
            ? "Phiên làm việc đã hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại!"
            : "Session expired or unauthorized. Please log in again!"
        );
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction failed");
      }

      setResult(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Prediction failed. Please try again.");
      console.error("Prediction error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => { if (currentStep < totalSteps) setCurrentStep(currentStep + 1); };
  const handlePrev = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleReset = () => { setFormData(defaultFormData); setResult(null); setError(""); setCurrentStep(1); };

  const isStep1Valid = formData.age && formData.sex;
  const isStep2Valid = formData.trestbps && formData.chol && formData.thalch && formData.oldpeak;
  const isStep3Valid = formData.cp && formData.restecg && formData.slope;

  const canProceed = () => {
    if (currentStep === 1) return isStep1Valid;
    if (currentStep === 2) return isStep2Valid;
    if (currentStep === 3) return isStep3Valid;
    return false;
  };

  const stepIcons = [User, Activity, Stethoscope];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((step) => {
            const StepIcon = stepIcons[step - 1];
            return (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                    step === currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : step < currentStep
                      ? "bg-success border-success text-success-foreground"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-6 h-6" />
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded ${
                      step < currentStep ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-16 mt-3">
          <span className="text-sm text-muted-foreground">
            {language === "vi" ? "Thông tin cơ bản" : "Basic Info"}
          </span>
          <span className="text-sm text-muted-foreground">
            {language === "vi" ? "Chỉ số tim mạch" : "Cardiovascular"}
          </span>
          <span className="text-sm text-muted-foreground">
            {language === "vi" ? "Triệu chứng" : "Symptoms"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {currentStep === 1 && (language === "vi" ? "Thông tin cơ bản" : "Basic Information")}
                {currentStep === 2 && (language === "vi" ? "Chỉ số tim mạch" : "Cardiovascular Indicators")}
                {currentStep === 3 && (language === "vi" ? "Triệu chứng & Chẩn đoán" : "Symptoms & Diagnosis")}
              </CardTitle>
              <CardDescription>
                {language === "vi" 
                  ? `Bước ${currentStep} / ${totalSteps} - Vui lòng nhập đầy đủ thông tin`
                  : `Step ${currentStep} of ${totalSteps} - Please fill in all fields`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="block_name">
                      {language === "vi" ? "Tên phiên chẩn đoán (tuỳ chọn)" : "Diagnosis Session Name (optional)"}
                    </Label>
                    <Input
                      id="block_name"
                      type="text"
                      placeholder={language === "vi" ? "VD: Kiểm tra định kỳ tháng 4" : "E.g., April regular checkup"}
                      value={formData.name_prediction}
                      onChange={(e) => updateField("name_prediction", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="age">{t("field.age")} *</Label>
                      <Input
                        id="age"
                        type="number"
                        min="1"
                        max="120"
                        placeholder="VD: 45"
                        value={formData.age}
                        onChange={(e) => updateField("age", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sex">{t("field.sex")} *</Label>
                      <Select
                        id="sex"
                        value={formData.sex}
                        onChange={(e) => updateField("sex", e.target.value)}
                      >
                        <option value="1">{t("field.sex.male")}</option>
                        <option value="0">{t("field.sex.female")}</option>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="height">
                        {language === "vi" ? "Chiều cao (cm)" : "Height (cm)"}
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        min="50"
                        max="250"
                        placeholder="VD: 170"
                        value={formData.height}
                        onChange={(e) => updateField("height", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">
                        {language === "vi" ? "Cân nặng (kg)" : "Weight (kg)"}
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        min="10"
                        max="300"
                        placeholder="VD: 70"
                        value={formData.weight}
                        onChange={(e) => updateField("weight", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Cardiovascular Indicators */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="trestbps">{t("field.trestbps")} *</Label>
                      <Input
                        id="trestbps"
                        type="number"
                        min="50"
                        max="250"
                        placeholder="VD: 120"
                        value={formData.trestbps}
                        onChange={(e) => updateField("trestbps", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chol">{t("field.chol")} *</Label>
                      <Input
                        id="chol"
                        type="number"
                        min="100"
                        max="600"
                        placeholder="VD: 200"
                        value={formData.chol}
                        onChange={(e) => updateField("chol", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="thalch">{t("field.thalch")} *</Label>
                      <Input
                        id="thalch"
                        type="number"
                        min="60"
                        max="220"
                        placeholder="VD: 150"
                        value={formData.thalch}
                        onChange={(e) => updateField("thalch", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oldpeak">{t("field.oldpeak")} *</Label>
                      <Input
                        id="oldpeak"
                        type="number"
                        step="0.1"
                        min="-5"
                        max="10"
                        placeholder="VD: 1.5"
                        value={formData.oldpeak}
                        onChange={(e) => updateField("oldpeak", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fbs">{t("field.fbs")}</Label>
                      <Select
                        id="fbs"
                        value={formData.fbs}
                        onChange={(e) => updateField("fbs", e.target.value)}
                      >
                        <option value="0">{t("field.fbs.no")}</option>
                        <option value="1">{t("field.fbs.yes")}</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exang">{t("field.exang")}</Label>
                      <Select
                        id="exang"
                        value={formData.exang}
                        onChange={(e) => updateField("exang", e.target.value)}
                      >
                        <option value="0">{t("field.fbs.no")}</option>
                        <option value="1">{t("field.fbs.yes")}</option>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Symptoms */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cp">{t("field.cp")} *</Label>
                    <Select
                      id="cp"
                      value={formData.cp}
                      onChange={(e) => updateField("cp", e.target.value)}
                    >
                      <option value="typical_angina">{t("field.cp.typical")}</option>
                      <option value="atypical_angina">{t("field.cp.atypical")}</option>
                      <option value="non_anginal">{t("field.cp.nonAnginal")}</option>
                      <option value="asymptomatic">{t("field.cp.asymptomatic")}</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restecg">{t("field.restecg")} *</Label>
                    <Select
                      id="restecg"
                      value={formData.restecg}
                      onChange={(e) => updateField("restecg", e.target.value)}
                    >
                      <option value="normal">{t("field.restecg.normal")}</option>
                      <option value="st_t_abnormality">{t("field.restecg.sttwave")}</option>
                      <option value="lv_hypertrophy">{t("field.restecg.lvh")}</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slope">{t("field.slope")} *</Label>
                    <Select
                      id="slope"
                      value={formData.slope}
                      onChange={(e) => updateField("slope", e.target.value)}
                    >
                      <option value="upsloping">{t("field.slope.upsloping")}</option>
                      <option value="flat">{t("field.slope.flat")}</option>
                      <option value="downsloping">{t("field.slope.downsloping")}</option>
                    </Select>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive mt-6">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {language === "vi" ? "Quay lại" : "Previous"}
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    {language === "vi" ? "Tiếp theo" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !canProceed()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        {t("predict.submit")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ResultDisplay result={result} onReset={handleReset} />
          </div>
        </div>
      </div>
      <HeartChatbot latestResult={result} />
    </div>
  );
} 