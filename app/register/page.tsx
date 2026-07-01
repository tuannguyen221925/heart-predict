"use client";

import { RegisterFormAPI } from "@/components/auth/register-form-api";
import { Header } from "@/components/header";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header user={null} />
      <main className="container mx-auto px-4 py-16 flex items-center justify-center">
        <RegisterFormAPI />
      </main>
    </div>
  );
}
