"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/features/auth/lib/api";
import type { AuthResponse, AuthUser } from "@/features/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

type AuthBootstrapMessage =
  | { type: "REFRESH_STARTED" }
  | { type: "REFRESH_SUCCEEDED" }
  | { type: "REFRESH_FAILED" };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_BOOTSTRAP_CHANNEL = "auth-bootstrap";

/** Lets a sibling reload's Set-Cookie land before one bootstrap retry. */
const BOOTSTRAP_REFRESH_RETRY_DELAY_MS = 100;

/** Max wait when another document announced REFRESH_STARTED. Never infinite. */
const REMOTE_REFRESH_WAIT_MS = 150;

async function requestRefreshSession(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/refresh", {
    method: "POST",
  }) as Promise<AuthResponse>;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isAuthBootstrapMessage(value: unknown): value is AuthBootstrapMessage {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }

  const type = (value as { type: unknown }).type;
  return type === "REFRESH_STARTED" || type === "REFRESH_SUCCEEDED" || type === "REFRESH_FAILED";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshLockRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const remoteRefreshInProgressRef = useRef(false);
  const remoteRefreshWaitersRef = useRef<Array<() => void>>([]);

  const setAuthState = useCallback((nextUser: AuthUser | null, nextAccessToken: string | null) => {
    setUser(nextUser);
    setAccessToken(nextAccessToken);
  }, []);

  const settleRemoteRefreshWaiters = useCallback(() => {
    remoteRefreshInProgressRef.current = false;
    const waiters = remoteRefreshWaitersRef.current;
    remoteRefreshWaitersRef.current = [];
    for (const waiter of waiters) {
      waiter();
    }
  }, []);

  const postBootstrapMessage = useCallback((message: AuthBootstrapMessage) => {
    try {
      channelRef.current?.postMessage(message);
    } catch {
      // BroadcastChannel is coordination only — auth must work without it.
    }
  }, []);

  const waitForRemoteRefreshIfNeeded = useCallback(async () => {
    if (!remoteRefreshInProgressRef.current) {
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };

      remoteRefreshWaitersRef.current.push(done);
      window.setTimeout(done, REMOTE_REFRESH_WAIT_MS);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (refreshLockRef.current) {
      return;
    }

    refreshLockRef.current = true;

    try {
      await waitForRemoteRefreshIfNeeded();

      postBootstrapMessage({ type: "REFRESH_STARTED" });

      try {
        const result = await requestRefreshSession();
        setAuthState(result.user, result.accessToken);
        postBootstrapMessage({ type: "REFRESH_SUCCEEDED" });
        return;
      } catch {
        // Overlapping reloads can consume token A while this page still sent A.
        // Browser jar may already hold rotated token B — one delayed retry only.
      }

      await wait(BOOTSTRAP_REFRESH_RETRY_DELAY_MS);

      try {
        const result = await requestRefreshSession();
        setAuthState(result.user, result.accessToken);
        postBootstrapMessage({ type: "REFRESH_SUCCEEDED" });
      } catch {
        postBootstrapMessage({ type: "REFRESH_FAILED" });
        setAuthState(null, null);
      }
    } finally {
      refreshLockRef.current = false;
      setIsLoading(false);
    }
  }, [postBootstrapMessage, setAuthState, waitForRemoteRefreshIfNeeded]);

  const login = useCallback(async (email: string, password: string) => {
    const result = (await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })) as AuthResponse;
    setAuthState(result.user, result.accessToken);
  }, [setAuthState]);

  const signup = useCallback(async (email: string, password: string) => {
    const result = (await apiRequest<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })) as AuthResponse;
    setAuthState(result.user, result.accessToken);
  }, [setAuthState]);

  const logout = useCallback(async () => {
    try {
      await apiRequest<{ success: boolean }>("/api/auth/logout", { method: "POST" });
    } finally {
      setAuthState(null, null);
    }
  }, [setAuthState]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel(AUTH_BOOTSTRAP_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isAuthBootstrapMessage(event.data)) {
        return;
      }

      if (event.data.type === "REFRESH_STARTED") {
        remoteRefreshInProgressRef.current = true;
        return;
      }

      settleRemoteRefreshWaiters();
    };

    return () => {
      channel.close();
      channelRef.current = null;
      settleRemoteRefreshWaiters();
    };
  }, [settleRemoteRefreshWaiters]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      signup,
      logout,
      refresh,
    }),
    [accessToken, isLoading, login, logout, refresh, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
