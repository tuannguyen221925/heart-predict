"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { MultiStepDiagnosisForm } from "@/components/diagnosis/multi-step-form";
import { useLanguage } from "@/lib/i18n/context";
import { Loader2 } from "lucide-react";

export default function DiagnosisPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/login");
    } else {
      setUsername(storedUsername);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={username ? { id: 0, email: "", full_name: username } : null} />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("predict.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("predict.subtitle")}</p>
        </div>
        <MultiStepDiagnosisForm />
      </main>
    </div>
  );
}
