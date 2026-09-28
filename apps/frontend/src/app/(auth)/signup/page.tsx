"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { useAuth } from "@/providers/auth-provider";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (email: string, password: string, confirmPassword?: string) => {
    setError(null);
    if (confirmPassword !== password) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(email, password);
      router.replace("/dashboard");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "";
      setError(message === "User already exists"
        ? "An account with this email already exists."
        : message === "Too many requests. Please try again later."
          ? "Too many attempts. Please try again later."
          : message.includes("Password")
            ? "Password does not meet the requirements."
            : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <AuthForm mode="signup" onSubmit={handleSubmit} error={error} isSubmitting={isSubmitting} />
    </main>
  );
}
