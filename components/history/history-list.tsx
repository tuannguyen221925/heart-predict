"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react";

interface Prediction {
  id: number;
  age: number;
  sex: number;
  cp: string;
  trestbps: number;
  chol: number;
  fbs: number;
  restecg: string;
  thalch: number;
  exang: number;
  oldpeak: number;
  slope: string;
  ca: number;
  thal: string;
  prediction: number;
  probability: number;
  created_at: string;
}

export function HistoryList() {
  const { t, language } = useLanguage();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await fetch("/api/predictions");
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/predictions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPredictions((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete prediction:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getFieldLabel = (field: string, value: string | number) => {
    if (field === "sex") return value === 1 ? t("field.sex.male") : t("field.sex.female");
    if (field === "fbs" || field === "exang") return value === 1 ? t("field.fbs.yes") : t("field.fbs.no");
    return value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("history.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {predictions.length} {language === "vi" ? "kết quả" : "results"}
          </p>
        </div>
        <Activity className="h-8 w-8 text-primary" />
      </div>

      {predictions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{t("history.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <Card key={prediction.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expandedId === prediction.id ? null : prediction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        prediction.prediction === 1
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {prediction.prediction === 1 ? (
                        <AlertTriangle className="h-6 w-6" />
                      ) : (
                        <CheckCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {prediction.prediction === 1
                          ? t("predict.riskHigh")
                          : t("predict.riskLow")}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(prediction.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {t("predict.probability")}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          prediction.prediction === 1 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {(prediction.probability * 100).toFixed(1)}%
                      </div>
                    </div>
                    {expandedId === prediction.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedId === prediction.id && (
                <CardContent className="border-t bg-muted/30 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.age")}</div>
                      <div className="font-medium">{prediction.age}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.sex")}</div>
                      <div className="font-medium">{getFieldLabel("sex", prediction.sex)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.cp")}</div>
                      <div className="font-medium capitalize">{prediction.cp}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.trestbps")}</div>
                      <div className="font-medium">{prediction.trestbps} mm Hg</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.chol")}</div>
                      <div className="font-medium">{prediction.chol} mg/dl</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.fbs")}</div>
                      <div className="font-medium">{getFieldLabel("fbs", prediction.fbs)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.restecg")}</div>
                      <div className="font-medium capitalize">{prediction.restecg}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.thalch")}</div>
                      <div className="font-medium">{prediction.thalch} bpm</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.exang")}</div>
                      <div className="font-medium">{getFieldLabel("exang", prediction.exang)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.oldpeak")}</div>
                      <div className="font-medium">{prediction.oldpeak}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.slope")}</div>
                      <div className="font-medium capitalize">{prediction.slope}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.ca")}</div>
                      <div className="font-medium">{prediction.ca}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t("field.thal")}</div>
                      <div className="font-medium capitalize">{prediction.thal}</div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(prediction.id);
                      }}
                      disabled={deletingId === prediction.id}
                    >
                      {deletingId === prediction.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {t("history.delete")}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
