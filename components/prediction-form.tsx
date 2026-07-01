"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, AlertTriangle, CheckCircle, Save, RotateCcw, Activity, Gauge, TrendingUp } from "lucide-react";
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

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  
  const localToken = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (localToken) return localToken;

  const value = `; ${document.cookie}`;
  const partsAuth = value.split(`; auth_token=`);
  if (partsAuth.length === 2) return partsAuth.pop()?.split(';').shift() || null;

  const partsAccess = value.split(`; access_token=`);
  if (partsAccess.length === 2) return partsAccess.pop()?.split(';').shift() || null;

  return null;
};

// Circular Progress Component
function CircularProgress({ percentage, risk_level, label }: { percentage: number; risk_level: string; label: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getRiskColor = () => {
    if (percentage < 30) return { bg: "from-emerald-500 to-teal-500", text: "text-emerald-600", ring: "ring-emerald-200" };
    if (percentage < 60) return { bg: "from-amber-500 to-orange-500", text: "text-amber-600", ring: "ring-amber-200" };
    return { bg: "from-red-500 to-rose-500", text: "text-red-600", ring: "ring-red-200" };
  };

  const colors = getRiskColor();

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-32 h-32 rounded-full ring-8 ${colors.ring} bg-gradient-to-br ${colors.bg} p-1`}>
        <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center relative">
          <svg className="absolute w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`text-transparent bg-gradient-to-r ${colors.bg} bg-clip-text transition-all duration-1000`}
              style={{
                background: `conic-gradient(from 0deg, ${colors.bg.split(' ')[1]} 0deg, ${colors.bg.split(' ')[3]} ${percentage * 3.6}deg, #e5e7eb ${percentage * 3.6}deg)`,
              }}
            />
          </svg>
          <div className="text-center z-10">
            <div className={`text-3xl font-bold ${colors.text}`}>{percentage.toFixed(0)}%</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Risk</div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        <p className={`text-xs font-bold uppercase mt-1 ${colors.text}`}>{risk_level}</p>
      </div>
    </div>
  );
}

// Gradient Progress Bar
function GradientProgressBar({ percentage }: { percentage: number }) {
  const getGradient = () => {
    if (percentage < 30) return "from-emerald-500 to-teal-500";
    if (percentage < 60) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Clinical Evaluation</span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{(percentage * 100).toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-1000 shadow-lg shadow-current/20`}
          style={{ width: `${percentage * 100}%` }}
        />
      </div>
    </div>
  );
}

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
          "Authorization": `Bearer ${currentToken}`
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
              CardioPredic AI
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Advanced Heart Disease Risk Assessment</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Patient Information</CardTitle>
                    <CardDescription>Enter comprehensive clinical data for accurate AI prediction</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Diagnosis Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name_prediction" className="text-sm font-semibold">Diagnosis Name (Optional)</Label>
                    <Input
                      id="name_prediction"
                      value={formData.name_prediction}
                      onChange={handleChange}
                      placeholder="e.g., Routine Health Check - June"
                      className="border-gray-200 dark:border-gray-700 focus:ring-rose-500"
                    />
                  </div>

                  {/* Section 1: Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-rose-500 to-pink-500 rounded-full" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-sm font-medium">Age *</Label>
                        <Input id="age" type="number" min="1" required value={formData.age} onChange={handleChange} placeholder="55" className="border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex" className="text-sm font-medium">Gender</Label>
                        <select id="sex" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.sex} onChange={handleChange}>
                          <option value="1">Male</option>
                          <option value="0">Female</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-sm font-medium">Height (cm) *</Label>
                        <Input id="height" type="number" min="50" required value={formData.height} onChange={handleChange} placeholder="170" className="border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-sm font-medium">Weight (kg) *</Label>
                        <Input id="weight" type="number" min="10" required value={formData.weight} onChange={handleChange} placeholder="65" className="border-gray-200 dark:border-gray-700" />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Clinical Vitals */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
                      Clinical Vitals
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
                      <div className="space-y-2">
                        <Label htmlFor="trestbps" className="text-sm font-medium">Systolic BP (mmHg) *</Label>
                        <Input id="trestbps" type="number" min="50" required value={formData.trestbps} onChange={handleChange} placeholder="140" className="border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chol" className="text-sm font-medium">Cholesterol (mg/dl) *</Label>
                        <Input id="chol" type="number" min="100" required value={formData.chol} onChange={handleChange} placeholder="240" className="border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thalch" className="text-sm font-medium">Max Heart Rate *</Label>
                        <Input id="thalch" type="number" min="60" required value={formData.thalch} onChange={handleChange} placeholder="150" className="border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oldpeak" className="text-sm font-medium">ST Depression (Oldpeak) *</Label>
                        <Input id="oldpeak" type="number" step="0.1" required value={formData.oldpeak} onChange={handleChange} placeholder="1.5" className="border-gray-200 dark:border-gray-700" />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Advanced Clinical Parameters */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full" />
                      Advanced Parameters
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
                      <div className="space-y-2">
                        <Label htmlFor="cp" className="text-sm font-medium">Chest Pain Type</Label>
                        <select id="cp" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.cp} onChange={handleChange}>
                          <option value="typical angina">Typical Angina</option>
                          <option value="atypical angina">Atypical Angina</option>
                          <option value="non-anginal">Non-Anginal</option>
                          <option value="asymptomatic">Asymptomatic</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fbs" className="text-sm font-medium">Fasting Blood Sugar &gt; 120</Label>
                        <select id="fbs" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.fbs} onChange={handleChange}>
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="restecg" className="text-sm font-medium">Resting ECG</Label>
                        <select id="restecg" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.restecg} onChange={handleChange}>
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exang" className="text-sm font-medium">Exercise-Induced Angina</Label>
                        <select id="exang" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.exang} onChange={handleChange}>
                          <option value="0">No</option>
                          <option value="1">Yes</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slope" className="text-sm font-medium">ST Slope</Label>
                        <select id="slope" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.slope} onChange={handleChange}>
                          <option value="up">Up</option>
                          <option value="flat">Flat</option>
                          <option value="down">Down</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ca" className="text-sm font-medium">Major Vessels</Label>
                        <select id="ca" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.ca} onChange={handleChange}>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="thal" className="text-sm font-medium">Thalassemia</Label>
                        <select id="thal" className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent" value={formData.thal} onChange={handleChange}>
                          <option value="normal">Normal</option>
                          <option value="fixed">Fixed</option>
                          <option value="reversible">Reversible</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 p-4 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Gauge className="mr-2 h-5 w-5" /> Start Prediction</>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleReset} 
                      className="px-4 h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 sticky top-8">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle>Risk Assessment</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pt-8">
                {result ? (
                  <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                    {/* AI Prediction Gauge */}
                    <div className="flex justify-center">
                      <CircularProgress 
                        percentage={result.ai_prediction.probability * 100} 
                        risk_level={result.ai_prediction.risk_level}
                        label="AI Prediction"
                      />
                    </div>

                    {/* AI Message */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        <span className="font-semibold text-blue-900 dark:text-blue-300">AI Analysis:</span> {result.ai_prediction.message}
                      </p>
                    </div>

                    {/* Clinical Evaluation */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-600" />
                        Clinical Evaluation
                      </h4>
                      <GradientProgressBar percentage={result.clinical_evaluation?.probability || 0} />
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic border-t pt-3">
                        * {result.clinical_evaluation.message}
                      </p>
                    </div>

                    {/* BMI Display */}
                    {result.bmi && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Body Mass Index</span>
                          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{result.bmi.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <Button
                      className={`w-full h-12 font-semibold transition-all ${
                        saved
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      } text-white shadow-lg hover:shadow-xl`}
                      onClick={handleSave}
                      disabled={isSaving || saved}
                    >
                      {isSaving ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                      ) : saved ? (
                        <><CheckCircle className="mr-2 h-5 w-5" /> Saved to Database</>
                      ) : (
                        <><Save className="mr-2 h-5 w-5" /> Save Result</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full mb-4">
                      <Heart className="h-12 w-12 opacity-50" />
                    </div>
                    <p className="text-sm text-center px-4 leading-relaxed">
                      Fill in the patient information and click <span className="font-semibold">"Start Prediction"</span> to generate a comprehensive risk assessment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
