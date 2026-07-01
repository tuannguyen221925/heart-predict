"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Heart, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";

export function RegisterFormAPI() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Regex kiểm tra độ mạnh mật khẩu theo thiết kế Backend (9-15 ký tự, Hoa, Thường, Số, Ký tự đặc biệt)
  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,15}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t("auth.passwordMismatch"));
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError(
        language === "vi"
          ? "Mật khẩu phải từ 9-15 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)"
          : "Password must be 9-15 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&)"
      );
      setIsLoading(false);
      return;
    }

    try {
      // Gửi request đăng ký dạng JSON body lên API Backend
      const response = await fetch(API_ENDPOINTS.register || "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          email: formData.email || null,
          phone: formData.phone || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ── KHOÁ CHÍ MẠNG: TỰ ĐỘNG LƯU PHIÊN ĐĂNG NHẬP SAU KHI ĐĂNG KÝ THÀNH CÔNG ──
        localStorage.setItem("token", data.access_token); // Lưu token phục vụ các request chẩn đoán (Authorization Header)
        localStorage.setItem("username", formData.username);     // Lưu username để page.tsx xác thực danh tính không bị kick về /login
        
        alert(
          language === "vi" 
            ? "Đăng ký thành công! Hệ thống đang tự động đăng nhập..." 
            : "Registration successful! Automatically logging in..."
        );

        // Đưa người dùng vào thẳng trang chẩn đoán vô cùng mượt mà
        router.push("/diagnosis");
      } else {
        setError(data.detail || (language === "vi" ? "Đăng ký thất bại" : "Registration failed"));
      }
    } catch (err) {
      setError(language === "vi" ? "Lỗi kết nối máy chủ" : "Server connection error");
    } finally {
      setIsLoading(false);
    }
  };

  // State hỗ trợ kiểm tra nhanh các điều kiện bảo mật của mật khẩu trên giao diện UI
  const passwordChecks = {
    length: formData.password.length >= 9 && formData.password.length <= 15,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[@$!%*?&]/.test(formData.password),
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Heart className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
        <CardDescription>HeartGuard AI</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === "vi" ? "Số điện thoại" : "Phone"}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0123456789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
              maxLength={12}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")} *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                minLength={9}
                maxLength={15}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Danh sách kiểm tra điều kiện bảo mật trực quan cho người dùng */}
            {formData.password && (
              <div className="space-y-1 text-xs mt-2 transition-all">
                <div className={`flex items-center gap-1 ${passwordChecks.length ? "text-green-500" : "text-muted-foreground"}`}>
                  <CheckCircle className="h-3 w-3" /> 9-15 ký tự
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.uppercase ? "text-green-500" : "text-muted-foreground"}`}>
                  <CheckCircle className="h-3 w-3" /> 1 chữ hoa (A-Z)
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.lowercase ? "text-green-500" : "text-muted-foreground"}`}>
                  <CheckCircle className="h-3 w-3" /> 1 chữ thường (a-z)
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.number ? "text-green-500" : "text-muted-foreground"}`}>
                  <CheckCircle className="h-3 w-3" /> 1 số (0-9)
                </div>
                <div className={`flex items-center gap-1 ${passwordChecks.special ? "text-green-500" : "text-muted-foreground"}`}>
                  <CheckCircle className="h-3 w-3" /> 1 ký tự đặc biệt (@$!%*?&)
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("auth.confirmPassword")} *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
                minLength={9}
                maxLength={15}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-destructive mt-1">
                {language === "vi" ? "Mật khẩu không khớp" : "Passwords do not match"}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              t("auth.register")
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("auth.login")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}