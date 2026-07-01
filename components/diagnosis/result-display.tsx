"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Bot,
  Stethoscope,
  Heart,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCcw,
} from "lucide-react";

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

interface ResultDisplayProps {
  result: PredictionResult | null;
  onReset: () => void;
}

export function ResultDisplay({ result, onReset }: ResultDisplayProps) {
  const { language } = useLanguage();

  if (!result) return null;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "THAP":
      case "THẤP":
      case "LOW":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          text: "text-emerald-600 dark:text-emerald-400",
          icon: "text-emerald-500",
          gradient: "from-emerald-500/20 to-emerald-600/10",
        };
      case "TRUNG BINH":
      case "TRUNG BÌNH":
      case "MEDIUM":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-600 dark:text-amber-400",
          icon: "text-amber-500",
          gradient: "from-amber-500/20 to-amber-600/10",
        };
      case "CAO":
      case "HIGH":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          text: "text-orange-600 dark:text-orange-400",
          icon: "text-orange-500",
          gradient: "from-orange-500/20 to-orange-600/10",
        };
      case "RAT CAO":
      case "RẤT CAO":
      case "VERY HIGH":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-600 dark:text-red-400",
          icon: "text-red-500",
          gradient: "from-red-500/20 to-red-600/10",
        };
      default:
        return {
          bg: "bg-muted",
          border: "border-border",
          text: "text-muted-foreground",
          icon: "text-muted-foreground",
          gradient: "from-muted to-muted",
        };
    }
  };

  const getTrendIcon = (probability: number) => {
    if (probability < 0.3) return <TrendingDown className="h-4 w-4" />;
    if (probability > 0.6) return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  if (!result) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {language === "vi" ? "Ket qua du doan" : "Prediction Result"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="relative mb-6">
              <Heart className="h-16 w-16 opacity-10" />
              <Activity className="h-8 w-8 absolute bottom-0 right-0 opacity-20" />
            </div>
            <p className="text-sm text-center max-w-[200px]">
              {language === "vi"
                ? "Nhap thong tin suc khoe va nhan du doan de xem ket qua"
                : "Enter your health data and click predict to see results"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use data from API response
  const aiData = result.ai_prediction;
  const clinicalData = result.clinical_evaluation;
  
  const aiColors = getRiskColor(aiData.risk_level);
  const clinicalColors = getRiskColor(clinicalData.risk_level);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          {language === "vi" ? "Ket qua phan tich" : "Analysis Result"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-3">
          {/* AI Prediction Card */}
          <div className={`relative overflow-hidden rounded-xl border ${aiColors.border} ${aiColors.bg} p-4`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${aiColors.gradient} opacity-50`} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  AI
                </span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className={`mb-2 ${aiColors.icon}`}>
                  {result.prediction === 1 ? (
                    <AlertTriangle className="h-10 w-10" />
                  ) : (
                    <CheckCircle className="h-10 w-10" />
                  )}
                </div>
                <span className={`text-sm font-bold ${aiColors.text}`}>
                  {aiData.risk_level}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    {(aiData.probability * 100).toFixed(0)}%
                  </span>
                  <span className={aiColors.text}>
                    {getTrendIcon(aiData.probability)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {language === "vi" ? "Xac suat rui ro" : "Risk probability"}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Assessment Card */}
          <div className={`relative overflow-hidden rounded-xl border ${clinicalColors.border} ${clinicalColors.bg} p-4`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${clinicalColors.gradient} opacity-50`} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {language === "vi" ? "Lam sang" : "Clinical"}
                </span>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className={`mb-2 ${clinicalColors.icon}`}>
                  {clinicalData.probability >= 0.5 ? (
                    <AlertTriangle className="h-10 w-10" />
                  ) : (
                    <CheckCircle className="h-10 w-10" />
                  )}
                </div>
                <span className={`text-sm font-bold ${clinicalColors.text}`}>
                  {clinicalData.risk_level}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    {(clinicalData.probability * 100).toFixed(0)}%
                  </span>
                  <span className={clinicalColors.text}>
                    {getTrendIcon(clinicalData.probability)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {language === "vi" ? "Diem lam sang" : "Clinical score"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bars for both AI and Clinical */}
        <div className="space-y-4">
          {/* AI Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {language === "vi" ? "Rui ro AI" : "AI Risk"}
              </span>
              <span className={`font-medium ${aiColors.text}`}>
                {(aiData.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  aiData.probability >= 0.7
                    ? "bg-gradient-to-r from-red-400 to-red-600"
                    : aiData.probability >= 0.5
                    ? "bg-gradient-to-r from-orange-400 to-orange-600"
                    : aiData.probability >= 0.3
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                }`}
                style={{ width: `${aiData.probability * 100}%` }}
              />
            </div>
          </div>
          
          {/* Clinical Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                {language === "vi" ? "Rui ro lam sang" : "Clinical Risk"}
              </span>
              <span className={`font-medium ${clinicalColors.text}`}>
                {(clinicalData.probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  clinicalData.probability >= 0.7
                    ? "bg-gradient-to-r from-red-400 to-red-600"
                    : clinicalData.probability >= 0.5
                    ? "bg-gradient-to-r from-orange-400 to-orange-600"
                    : clinicalData.probability >= 0.3
                    ? "bg-gradient-to-r from-amber-400 to-amber-600"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                }`}
                style={{ width: `${clinicalData.probability * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* BMI if available */}
        {result.bmi && (
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
            <span className="text-sm text-muted-foreground">
              {language === "vi" ? "Chi so BMI" : "BMI Index"}
            </span>
            <span className="font-semibold text-foreground">{result.bmi}</span>
          </div>
        )}

        {/* Clinical Recommendation */}
        <div className={`p-4 rounded-xl border ${clinicalColors.border} ${clinicalColors.bg}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${clinicalColors.icon}`}>
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {language === "vi" ? "Danh gia lam sang" : "Clinical Evaluation"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {clinicalData.message}
              </p>
            </div>
          </div>
        </div>

        {/* AI Message */}
        <div className={`p-4 rounded-xl border ${aiColors.border} ${aiColors.bg}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${aiColors.icon}`}>
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {language === "vi" ? "Phan tich AI" : "AI Analysis"}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {aiData.message}
              </p>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          className="w-full"
          variant="outline"
          onClick={onReset}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {language === "vi" ? "Du doan moi" : "New Prediction"}
        </Button>
      </CardContent>
    </Card>
  );
}
