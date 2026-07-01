"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, Globe, User, LogOut } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user?: { id: number; email: string; full_name: string } | null;
}

export function Header({ user }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">HeartGuard AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("nav.home")}
          </Link>
          {user && (
            <>
              <Link
                href="/diagnosis"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("nav.predict")}
              </Link>
              <Link
                href="/history"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("nav.history")}
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("nav.profile")}
              </Link>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} title="Toggle language">
            <Globe className="h-5 w-5" />
            <span className="sr-only">Toggle language</span>
          </Button>
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{user.full_name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title={t("auth.logout")}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">{t("auth.login")}</Button>
              </Link>
              <Link href="/register">
                <Button>{t("auth.register")}</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              href="/"
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.home")}
            </Link>
            {user && (
              <>
                <Link
                  href="/diagnosis"
                  className="block text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.predict")}
                </Link>
                <Link
                  href="/history"
                  className="block text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.history")}
                </Link>
                <Link
                  href="/profile"
                  className="block text-sm font-medium text-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.profile")}
                </Link>
              </>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={toggleLanguage}>
                <Globe className="h-4 w-4 mr-2" />
                {language === "vi" ? "EN" : "VI"}
              </Button>
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("auth.logout")}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">{t("auth.login")}</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">{t("auth.register")}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
