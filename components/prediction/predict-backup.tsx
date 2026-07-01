"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, AlertTriangle, CheckCircle, Save, RotateCcw } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api-config";

interface PredictionFormProps {
  userId: number;
}

interface PredictionResult {
  ai_prediction: {
    probability: number;
    risk_level: string;
    message: string;
  };
  clinical_evaluation: {
    probability: number;
    risk_level: string;
    message: string;
  };
  prediction: number;
  bmi?: number | null;
}

const defaultFormData = {
  age: "",
  sex: "1",
  cp: "asymptomatic", // Không có triệu chứng
  trestbps: "",
  chol: "",
  fbs: "0",
  restecg: "normal", // Bình thường
  thalch: "",
  exang: "0",
  oldpeak: "",
  slope: "flat", // Bằng phẳng
  ca: "0",
  thal: "normal",
};

// Hàm hỗ trợ đọc token từ cookie ở phía Client Component (Dùng cho hàm handleSubmit)
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// Mapping cho các giá trị từ form sang backend
const transformToBackendFormat = (formData: any) => {
  const age = parseFloat(formData.age);
  const trestbps = parseFloat(formData.trestbps);
  const chol = parseFloat(formData.chol);
  const thalch = parseFloat(formData.thalch);
  const oldpeak = parseFloat(formData.oldpeak) || 0;
  
  // Validation
  if (isNaN(age) || age <= 0) throw new Error("Tuổi không hợp lệ");
  if (isNaN(trestbps) || trestbps <= 0) throw new Error("Huyết áp không hợp lệ");
  if (isNaN(chol) || chol <= 0) throw new Error("Cholesterol không hợp lệ");
  if (isNaN(thalch) || thalch <= 0) throw new Error("Nhịp tim không hợp lệ");
  
  // Mapping Chest Pain (cp)
  const cpMapping: Record<string, any> = {
    "typical angina": { cp_typical_angina: 1, cp_atypical_angina: 0, cp_non_anginal: 0 },
    "atypical angina": { cp_typical_angina: 0, cp_atypical_angina: 1, cp_non_anginal: 0 },
    "non-anginal": { cp_typical_angina: 0, cp_atypical_angina: 0, cp_non_anginal: 1 },
    "asymptomatic": { cp_typical_angina: 0, cp_atypical_angina: 0, cp_non_anginal: 0 },
  };
  
  // Mapping Resting ECG (restecg)
  const restecgMapping: Record<string, any> = {
    "normal": { restecg_normal: 1, restecg_st_t_abnormality: 0 },
    "st-t abnormality": { restecg_normal: 0, restecg_st_t_abnormality: 1 },
    "lv hypertrophy": { restecg_normal: 0, restecg_st_t_abnormality: 0 },
  };
  
  // Mapping Slope
  const slopeMapping: Record<string, any> = {
    "upsloping": { slope_upsloping: 1, slope_flat: 0 },
    "flat": { slope_upsloping: 0, slope_flat: 1 },
    "downsloping": { slope_upsloping: 0, slope_flat: 0 },
  };
  
  const cpFields = cpMapping[formData.cp] || cpMapping["asymptomatic"];
  const restecgFields = restecgMapping[formData.restecg] || restecgMapping["normal"];
  const slopeFields = slopeMapping[formData.slope] || slopeMapping["flat"];
  
  const result = {
    name_prediction: "Dự đoán bệnh tim",
    age: age,
    sex: parseInt(formData.sex),
    trestbps: trestbps,
    chol: chol,
    fbs: parseInt(formData.fbs),
    thalch: thalch,
    exang: parseInt(formData.exang),
    oldpeak: oldpeak,
    ca_missing: parseInt(formData.ca) === 0 ? 1 : 0, 
    thal_missing: 0,
    ...cpFields,
    ...restecgFields,
    ...slopeFields,
    dataset_Hungary: 0,
    dataset_Switzerland: 0,
    dataset_VA_Long_Beach: 0,
    age_under_40: age < 40 ? 1 : 0,
    bp_age_ratio: trestbps / age,
    height: null,
    weight: null,
    include_bmi: false
  };
  
  console.log("📤 Sending to backend:", JSON.stringify(result, null, 2));
  return result;
};

export function PredictionForm({ userId }: PredictionFormProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      if (!formData.age) throw new Error("Vui lòng nhập tuổi");
      if (!formData.trestbps) throw new Error("Vui lòng nhập huyết áp tâm thu");
      if (!formData.chol) throw new Error("Vui lòng nhập cholesterol");
      if (!formData.thalch) throw new Error("Vui lòng nhập nhịp tim tối đa");
      
      const backendData = transformToBackendFormat(formData);
      const token = getCookie("auth_token"); // Lấy token xác thực từ cookie
      
      console.log(`🌐 Calling backend predict at: ${API_ENDPOINTS.predict}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(API_ENDPOINTS.predict, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(backendData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log("📡 Response status:", response.status);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Không thể đọc response từ server");
      }
      
      console.log("📥 Response data:", data);

      if (!response.ok) {
        const errorDetail = data.detail || JSON.stringify(data);
        throw new Error(`Lỗi ${response.status}: ${errorDetail}`);
      }

      setResult(data);
    } catch (error: any) {
      console.error("❌ Frontend error:", error);
      if (error.name === 'AbortError') {
        setError("Quá thời gian chờ. Vui lòng thử lại.");
      } else {
        setError(error.message || "Không thể kết nối đến server backend. Vui lòng kiểm tra lại dịch vụ.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 Đã được sửa đổi để gọi qua API Route trung gian của Next.js
  const handleSave = async () => {
    if (!result) return;
    
    setIsSaving(true);
    setError(""); // Reset thông báo lỗi cũ
    try {
      const backendData = transformToBackendFormat(formData);
      
      // Gọi tới Route Handler nội bộ Next.js thay vì link Render.
      // Trình duyệt sẽ tự đính kèm cookie HttpOnly vì cùng domain.
      const response = await fetch(`/api/predictions/save?username=tuan2205`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await response.json();
        console.error("Save failed:", errorData);
        setError(errorData.detail || `Không thể lưu kết quả: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to save prediction:", error);
      setError("Có lỗi xảy ra khi yêu cầu lưu dữ liệu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(defaultFormData);
    setResult(null);
    setError("");
    setSaved(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">HeartGuard AI</h1>
        <p className="mt-2 text-muted-foreground">Nhập các chỉ số sức khỏe để nhận kết quả dự đoán</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Thông tin sức khỏe
              </CardTitle>
              <CardDescription>
                Vui lòng nhập đầy đủ thông tin để được dự đoán chính xác
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="age">Tuổi *</Label>
                      <Input
                        id="age"
                        type="number"
                        min="1"
                        max="120"
                        placeholder="VD: 55"
                        value={formData.age}
                        onChange={(e) => updateField("age", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sex">Giới tính</Label>
                      <select
                        id="sex"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.sex}
                        onChange={(e) => updateField("sex", e.target.value)}
                      >
                        <option value="1">Nam</option>
                        <option value="0">Nữ</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Chỉ số tim mạch */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Chỉ số tim mạch</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="trestbps">Huyết áp tâm thu (mmHg) *</Label>
                      <Input
                        id="trestbps"
                        type="number"
                        min="50"
                        max="250"
                        placeholder="VD: 140"
                        value={formData.trestbps}
                        onChange={(e) => updateField("trestbps", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chol">Cholesterol (mg/dl) *</Label>
                      <Input
                        id="chol"
                        type="number"
                        min="100"
                        max="600"
                        placeholder="VD: 240"
                        value={formData.chol}
                        onChange={(e) => updateField("chol", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thalch">Nhịp tim tối đa *</Label>
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
                      <Label htmlFor="fbs">Đường huyết lúc đói &gt; 120 mg/dl</Label>
                      <select
                        id="fbs"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.fbs}
                        onChange={(e) => updateField("fbs", e.target.value)}
                      >
                        <option value="0">Không</option>
                        <option value="1">Có</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Triệu chứng & Chẩn đoán */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Triệu chứng & Chẩn đoán</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cp">Loại đau ngực *</Label>
                      <select
                        id="cp"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.cp}
                        onChange={(e) => updateField("cp", e.target.value)}
                      >
                        <option value="typical angina">Đau thắt ngực điển hình</option>
                        <option value="atypical angina">Đau ngực không điển hình</option>
                        <option value="non-anginal">Đau ngực không do tim</option>
                        <option value="asymptomatic">Không có triệu chứng</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exang">Đau thắt ngực khi gắng sức</Label>
                      <select
                        id="exang"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.exang}
                        onChange={(e) => updateField("exang", e.target.value)}
                      >
                        <option value="0">Không</option>
                        <option value="1">Có</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oldpeak">ST chênh lệch (oldpeak)</Label>
                      <Input
                        id="oldpeak"
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="VD: 1.5"
                        value={formData.oldpeak}
                        onChange={(e) => updateField("oldpeak", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restecg">Kết quả điện tâm đồ nghỉ</Label>
                      <select
                        id="restecg"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.restecg}
                        onChange={(e) => updateField("restecg", e.target.value)}
                      >
                        <option value="normal">Bình thường</option>
                        <option value="st-t abnormality">Bất thường sóng ST-T</option>
                        <option value="lv hypertrophy">Phì đại thất trái</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slope">Độ dốc ST</Label>
                      <select
                        id="slope"
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={formData.slope}
                        onChange={(e) => updateField("slope", e.target.value)}
                      >
                        <option value="upsloping">Dốc lên</option>
                        <option value="flat">Bằng phẳng</option>
                        <option value="downsloping">Dốc xuống</option>
                      </select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ca">Số mạch máu chính bị hẹp</Label>
                        <select
                          id="ca"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={formData.ca}
                          onChange={(e) => updateField("ca", e.target.value)}
                        >
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thal">Thalassemia</Label>
                        <select
                          id="thal"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={formData.thal}
                          onChange={(e) => updateField("thal", e.target.value)}
                        >
                          <option value="normal">Bình thường</option>
                          <option value="fixed defect">Khiếm khuyết cố định</option>
                          <option value="reversable defect">Khiếm khuyết đảo ngược</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex flex-col gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-bold">Lỗi:</span>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Dự đoán ngay
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Đặt lại
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Kết quả */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Kết quả dự đoán</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div
                    className={`flex flex-col items-center justify-center rounded-xl p-6 ${
                      result.prediction === 1
                        ? "bg-red-50 text-red-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {result.prediction === 1 ? (
                      <AlertTriangle className="h-12 w-12 mb-3" />
                    ) : (
                      <CheckCircle className="h-12 w-12 mb-3" />
                    )}
                    <span className="text-lg font-bold text-center">
                      {result.prediction === 1 ? "Nguy cơ CAO mắc bệnh tim" : "Nguy cơ THẤP mắc bệnh tim"}
                    </span>
                    <span className="text-sm mt-2 text-center text-gray-600">
                      {result.ai_prediction?.message || ""}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Độ chính xác (AI)</span>
                      <span className="font-bold text-lg">
                        {((result.ai_prediction?.probability || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          result.prediction === 1 ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${(result.ai_prediction?.probability || 0) * 100}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-muted-foreground">Đánh giá lâm sàng</span>
                      <span className="font-bold text-lg">
                        {((result.clinical_evaluation?.probability || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-blue-500"
                        style={{ width: `${(result.clinical_evaluation?.probability || 0) * 100}%` }}
                      />
                    </div>
                    
                    {result.bmi && (
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-muted-foreground">BMI</span>
                        <span className="font-bold">{result.bmi}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    variant={saved ? "secondary" : "default"}
                    onClick={handleSave}
                    disabled={isSaving || saved}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : saved ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {saved ? "Đã lưu" : "Lưu kết quả"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm text-center">
                    Nhập thông tin và nhấn "Dự đoán ngay" để xem kết quả
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}