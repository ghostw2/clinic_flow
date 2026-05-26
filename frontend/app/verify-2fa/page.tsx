"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/i18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, ShieldCheck } from "lucide-react";

export default function Verify2FAPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("pre_auth_token");
    if (!token) {
      router.replace("/login");
    } else {
      setPreAuthToken(token);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preAuthToken || code.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      await authApi.verify2FA(preAuthToken, code);
      sessionStorage.removeItem("pre_auth_token");
      await refreshUser();
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiCode =
        (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
      setError(apiCode ? t(`errors.${apiCode}`) : t("auth.twoFa.verifyError"));
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  if (!preAuthToken) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary text-primary-foreground rounded-xl p-3">
            <Stethoscope className="h-7 w-7" />
          </div>
          <span className="text-3xl font-bold text-slate-900">ClinicFlow</span>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-blue-100 rounded-full p-3">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t("auth.twoFa.cardTitle")}</CardTitle>
            <CardDescription>{t("auth.twoFa.subtitle")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                autoFocus
                autoComplete="one-time-code"
              />

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || code.length !== 6}
              >
                {loading ? t("auth.twoFa.submitting") : t("auth.twoFa.submit")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  sessionStorage.removeItem("pre_auth_token");
                  router.push("/login");
                }}
              >
                {t("auth.twoFa.back")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
