"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";

export function useAdminQuery<T>(queryKey: readonly unknown[], queryFn: (accessToken: string) => Promise<T>) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey,
    queryFn: () => queryFn(accessToken as string),
    enabled: Boolean(accessToken),
  });
}
