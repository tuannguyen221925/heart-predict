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
  userId?: number;
}

interface PredictionResult {
  ai_prediction: { probability: number; risk_level: string; message: string; };
  clinical_evaluation: { probability: number; risk_level: string; message: string; };
  prediction: number;
  bmi?: number | null;
}

const defaultFormData = {
  name_prediction: "",
  age: "", 
  sex: "1", 
  cp: "asymptomatic", 
  trestbps: "", 
  chol: "",
  fbs: "0", 
  restecg: "normal", 
  thalch: "", 
  exang: "0",
  oldpeak: "", 
  slope: "flat", 
  ca: "0", 
  thal: "normal",
  height: "",
  weight: "",
  include_bmi: true
};

// Hàm "quét" token toàn diện: Tìm trong cả LocalStorage và Cookie
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  
  // 1. Kiểm tra localStorage trước (Dành cho login-form-api)
  const localToken = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (localToken) return localToken;

  // 2. Kiểm tra Cookie (Dành cho login-form sử dụng Next.js API)
  const value = `; ${document.cookie}`;
  const partsAuth = value.split(`; auth_token=`);
  if (partsAuth.length === 2) return partsAuth.pop()?.split(';').shift() || null;

  const partsAccess = value.split(`; access_token=`);
  if (partsAccess.length === 2) return partsAccess.pop()?.split(';').shift() || null;

  return null;
};

export default function PredictionForm({ userId }: PredictionFormProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    
    try {
      const currentToken = getAuthToken();
      if (!currentToken) {
        throw new Error("Phiên làm việc đã hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại!");
      }

      const payload = {
        ...formData,
        age: Number(formData.age),
        sex: Number(formData.sex),
        trestbps: Number(formData.trestbps),
        chol: Number(formData.chol),
        thalch: Number(formData.thalch),
        oldpeak: Number(formData.oldpeak),
        height: Number(formData.height),
        weight: Number(formData.weight),
        include_bmi: true
      };

      const response = await fetch(API_ENDPOINTS.predict || "/api/predict", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}` // Trả lại viết hoa chữ A theo chuẩn OAuth2
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Lỗi xác thực hoặc kết nối đến server AI.");
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    setError("");

    try {
      const currentToken = getAuthToken();
      if (!currentToken) {
        throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để lưu kết quả!");
      }

      const response = await fetch("/api/prediction/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          name_prediction: formData.name_prediction || "Kiểm tra sức khỏe định kỳ",
          prediction_result: result.prediction,
          clinical_score: result.clinical_evaluation.probability * 10,
          probability: result.ai_prediction.probability,
          risk_level: result.ai_prediction.risk_level,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Không thể lưu kết quả chẩn đoán");
      }
      
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu kết quả vào hệ thống.");
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Khung nhập liệu (Cột trái - chiếm 2 phần) */}
        <div className="md:col-span-2">
          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Dự đoán nguy cơ bệnh tim
              </CardTitle>
              <CardDescription>Nhập đầy đủ các chỉ số lâm sàng để mô hình Deep Learning phân tích mức độ nguy cơ.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="name_prediction">Tên đợt chẩn đoán (Tùy chọn)</Label>
                  <Input
                    id="name_prediction"
                    value={formData.name_prediction}
                    onChange={handleChange}
                    placeholder="Ví dụ: Kiểm tra sức khỏe định kỳ tháng 6"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Tuổi *</Label>
                    <Input id="age" type="number" min="1" required value={formData.age} onChange={handleChange} placeholder="VD: 55" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Giới tính</Label>
                    <select id="sex" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.sex} onChange={handleChange}>
                      <option value="1">Nam</option>
                      <option value="0">Nữ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Chiều cao (cm) *</Label>
                    <Input id="height" type="number" min="50" required value={formData.height} onChange={handleChange} placeholder="VD: 170" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Cân nặng (kg) *</Label>
                    <Input id="weight" type="number" min="10" required value={formData.weight} onChange={handleChange} placeholder="VD: 65" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trestbps">Huyết áp tâm thu (mmHg) *</Label>
                    <Input id="trestbps" type="number" min="50" required value={formData.trestbps} onChange={handleChange} placeholder="VD: 140" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chol">Cholesterol (mg/dl) *</Label>
                    <Input id="chol" type="number" min="100" required value={formData.chol} onChange={handleChange} placeholder="VD: 240" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thalch">Nhịp tim tối đa *</Label>
                    <Input id="thalch" type="number" min="60" required value={formData.thalch} onChange={handleChange} placeholder="VD: 150" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oldpeak">Độ trầm cảm ST (Oldpeak) *</Label>
                    <Input id="oldpeak" type="number" step="0.1" required value={formData.oldpeak} onChange={handleChange} placeholder="VD: 1.5" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cp">Loại đau ngực</Label>
                    <select id="cp" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.cp} onChange={handleChange}>
                      <option value="typical angina">Đau thắt ngực điển hình</option>
                      <option value="atypical angina">Đau ngực không điển hình</option>
                      <option value="non-anginal">Đau ngực không do tim</option>
                      <option value="asymptomatic">Không có triệu chứng</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fbs">Đường huyết lúc đói &gt; 120 mg/dl</Label>
                    <select id="fbs" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.fbs} onChange={handleChange}>
                      <option value="0">Không</option>
                      <option value="1">Có</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang phân tích dữ liệu...</>
                    ) : (
                      <><Heart className="mr-2 h-4 w-4" /> Bắt đầu dự đoán</>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset} className="w-12 px-0">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Khung kết quả (Cột phải - chiếm 1 phần) */}
        <div>
          <Card className="h-full sticky top-6 shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle>Báo cáo lâm sàng</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {result ? (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className={`rounded-xl border p-5 text-center ${result.prediction === 1 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Mô hình AI dự đoán</div>
                    <div className={`text-4xl font-extrabold ${result.prediction === 1 ? 'text-red-600' : 'text-green-600'}`}>
                      {(result.ai_prediction.probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm font-bold mt-2 uppercase tracking-wide">
                      Mức độ: {result.ai_prediction.risk_level}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {result.ai_prediction.message}
                    </p>
                  </div>

                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Đánh giá lâm sàng</span>
                      <span className="font-semibold">{((result.clinical_evaluation?.probability || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 bg-blue-500" style={{ width: `${(result.clinical_evaluation?.probability || 0) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      * {result.clinical_evaluation.message}
                    </p>
                    
                    {result.bmi && (
                      <div className="flex justify-between items-center pt-3 mt-3 border-t">
                        <span className="text-sm text-muted-foreground">Chỉ số BMI</span>
                        <span className="font-bold">{result.bmi.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full h-12 text-md transition-all"
                    variant={saved ? "secondary" : "default"}
                    onClick={handleSave}
                    disabled={isSaving || saved}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : saved ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    ) : (
                      <Save className="mr-2 h-5 w-5" />
                    )}
                    {saved ? "Đã lưu vào cơ sở dữ liệu" : "Lưu kết quả chẩn đoán"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground h-full text-center">
                  <div className="p-4 bg-muted rounded-full mb-4">
                    <Heart className="h-10 w-10 opacity-40" />
                  </div>
                  <p className="text-sm px-4">Hãy điền thông tin và nhấn nút Dự đoán để xem báo cáo tổng quan từ AI.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}