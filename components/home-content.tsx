"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, Shield, Zap, ArrowRight, Stethoscope, BarChart3 } from "lucide-react";

interface HomeContentProps {
  user?: { id: number; email: string; full_name: string } | null;
}

export function HomeContent({ user }: HomeContentProps) {
  const { t } = useLanguage();

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Heart className="h-4 w-4" />
              AI-Powered Health Analysis
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-4 text-xl text-primary font-semibold">
              {t("home.subtitle")}
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {t("home.description")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Link href="/predict">
                  <Button size="lg" className="gap-2">
                    {t("home.startPrediction")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="gap-2">
                      {t("auth.register")}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg">
                      {t("auth.login")}
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
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Features
            </h2>
            <p className="mt-4 text-muted-foreground">
              Powered by machine learning and validated clinical data
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-0 bg-card shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("home.features.accurate")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("home.features.accurateDesc")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("home.features.fast")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("home.features.fastDesc")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 bg-card shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("home.features.secure")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("home.features.secureDesc")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How It Works
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Input Health Data</h3>
              <p className="text-muted-foreground">
                Enter your health indicators including blood pressure, cholesterol, and heart rate
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Our ML model analyzes your data using Logistic Regression trained on UCI dataset
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Results</h3>
              <p className="text-muted-foreground">
                Receive your risk assessment with probability score and recommendations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 text-center">
            <div>
              <div className="flex justify-center mb-4">
                <Stethoscope className="h-8 w-8" />
              </div>
              <div className="text-4xl font-bold mb-2">920+</div>
              <div className="text-primary-foreground/80">Training Samples</div>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <Activity className="h-8 w-8" />
              </div>
              <div className="text-4xl font-bold mb-2">35</div>
              <div className="text-primary-foreground/80">Health Features</div>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div className="text-4xl font-bold mb-2">85%+</div>
              <div className="text-primary-foreground/80">Accuracy Rate</div>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-primary-foreground/80">Data Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="border-0 bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
                Ready to Check Your Heart Health?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start your free assessment today and take the first step towards understanding your cardiovascular health.
              </p>
              {user ? (
                <Link href="/predict">
                  <Button size="lg" className="gap-2">
                    {t("home.startPrediction")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">HeartGuard AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Machine Learning for better heart health awareness.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
