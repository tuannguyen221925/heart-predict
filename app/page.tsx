"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Activity, Shield, Zap, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { t } = useLanguage();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header user={username ? { id: 0, email: "", full_name: username } : null} />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-8">
                <Heart className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
                {t("home.title")}
              </h1>
              <p className="text-xl md:text-2xl text-primary font-medium mb-4">
                {t("home.subtitle")}
              </p>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
                {t("home.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {username ? (
                  <Link href="/diagnosis">
                    <Button size="lg" className="text-lg px-8">
                      {t("home.startPrediction")}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button size="lg" className="text-lg px-8">
                        {t("auth.login")}
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="lg" variant="outline" className="text-lg px-8">
                        {t("auth.register")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-card border-border">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6">
                    <Activity className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t("home.features.accurate")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("home.features.accurateDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-success/10 text-success mb-6">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t("home.features.fast")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("home.features.fastDesc")}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-warning/10 text-warning mb-6">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {t("home.features.secure")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("home.features.secureDesc")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              San sang kiem tra suc khoe tim mach?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Chi can vai buoc don gian, ban se nhan duoc ket qua du doan chinh xac tu mo hinh AI.
            </p>
            <Link href={username ? "/diagnosis" : "/register"}>
              <Button size="lg">
                {username ? "Bat dau chan doan" : "Dang ky ngay"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>HeartGuard AI - Do an HK8 - Du doan benh tim mach</p>
        </div>
      </footer>
    </div>
  );
}
