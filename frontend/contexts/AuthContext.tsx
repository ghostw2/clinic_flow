"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login(email, password);

      if (data.requires_2fa && data.pre_auth_token) {
        // Store token temporarily so the verify page can read it
        sessionStorage.setItem("pre_auth_token", data.pre_auth_token);
        router.push("/verify-2fa");
        return;
      }

      if (data.user) {
        setUser(data.user);
        router.push("/dashboard");
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    setUser(null);
    window.location.href = "/login";
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.me();
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
