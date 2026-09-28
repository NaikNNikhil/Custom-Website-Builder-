"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (email: string, password: string) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "";
      setError(message === "Too many requests. Please try again later."
        ? "Too many attempts. Please try again later."
        : message === "Invalid email or password"
          ? message
          : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <AuthForm mode="login" onSubmit={handleSubmit} error={error} isSubmitting={isSubmitting} />
    </main>
  );
}
