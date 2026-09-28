"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
}
