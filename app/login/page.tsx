"use client";

import { LoginFormAPI } from "@/components/auth/login-form-api";
import { Header } from "@/components/header";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header user={null} />
      <main className="container mx-auto px-4 py-16 flex items-center justify-center">
        <LoginFormAPI />
      </main>
    </div>
  );
}
