"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { usersApi, authApi, billingApi } from "@/lib/api";

type PlanInfo = { key: string; name: string; amount: string; description: string };
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/i18nContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Check, ShieldCheck, ShieldOff, ExternalLink, Loader2 } from "lucide-react";
import type { User } from "@/types";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.enum(["admin", "doctor", "staff"]),
});
type UserForm = z.infer<typeof userSchema>;

const PLAN_STYLE: Record<string, { color: string; badge: string; popular?: boolean; featureKeys: string[] }> = {
  starter: {
    color: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-700",
    featureKeys: [
      "settings.billing.features.1doctor",
      "settings.billing.features.upTo100patients",
      "settings.billing.features.emailReminders",
      "settings.billing.features.calendarView",
    ],
  },
  growth: {
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    popular: true,
    featureKeys: [
      "settings.billing.features.upTo5doctors",
      "settings.billing.features.unlimitedPatients",
      "settings.billing.features.emailReminders",
      "settings.billing.features.priorityQueue",
    ],
  },
  clinic: {
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    featureKeys: [
      "settings.billing.features.unlimitedDoctors",
      "settings.billing.features.unlimitedPatients",
      "settings.billing.features.smsEmailReminders",
      "settings.billing.features.prioritySupport",
    ],
  },
};

type TwoFAStep = "idle" | "qr" | "confirm-enable" | "confirm-disable";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);

  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");

  const { data: users = [], mutate } = useSWR<User[]>("users", () =>
    usersApi.list().then((r) => r.data)
  );

  const { data: plans = [] } = useSWR<PlanInfo[]>("billing-plans", () =>
    billingApi.getPlans().then((r) => r.data)
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema) });

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("payment=success")) {
      toast({ title: t("settings.toast.subscriptionActivated"), description: t("settings.toast.subscriptionActivatedDesc") });
      window.history.replaceState({}, "", "/settings");
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateUser = async (values: UserForm) => {
    try {
      await usersApi.create(values);
      toast({ title: t("settings.toast.userCreated") });
      mutate();
      setUserFormOpen(false);
      reset();
    } catch {
      toast({ title: t("settings.toast.userCreateFailed"), variant: "destructive" });
    }
  };

  const isAdmin = user?.role === "admin";
  const isDemo = user?.clinic?.is_demo;
  const currentPlan = user?.clinic?.plan_name;
  const subStatus = user?.clinic?.subscription_status;
  const hasActiveSub = subStatus === "active";

  const start2FASetup = async () => {
    try {
      const { data } = await authApi.setup2FA();
      setQrCode(data.qr_code);
      setTwoFASecret(data.secret);
      setTwoFACode("");
      setTwoFAStep("qr");
    } catch {
      toast({ title: t("settings.toast.2faSetupFailed"), variant: "destructive" });
    }
  };

  const confirmEnable2FA = async () => {
    try {
      await authApi.enable2FA(twoFACode);
      await refreshUser();
      toast({ title: t("settings.toast.2faEnabled") });
      setTwoFAStep("idle");
      setTwoFACode("");
    } catch {
      toast({ title: t("settings.toast.2faInvalidCode"), variant: "destructive" });
      setTwoFACode("");
    }
  };

  const confirmDisable2FA = async () => {
    try {
      await authApi.disable2FA(twoFACode);
      await refreshUser();
      toast({ title: t("settings.toast.2faDisabled") });
      setTwoFAStep("idle");
      setTwoFACode("");
    } catch {
      toast({ title: t("settings.toast.2faInvalidCode"), variant: "destructive" });
      setTwoFACode("");
    }
  };

  const handleGetStarted = async (planKey: "starter" | "growth" | "clinic") => {
    setBillingLoading(planKey);
    try {
      const { data } = await billingApi.createCheckout(planKey);
      window.location.href = data.url;
    } catch {
      toast({ title: t("settings.toast.checkoutFailed"), variant: "destructive" });
      setBillingLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setBillingLoading("portal");
    try {
      const { data } = await billingApi.createPortal();
      window.location.href = data.url;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 402) {
        toast({ title: t("settings.toast.noActiveSub"), description: t("settings.toast.noActiveSubDesc"), variant: "destructive" });
      } else {
        toast({ title: t("settings.toast.portalFailed"), variant: "destructive" });
      }
      setBillingLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Clinic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.clinic.title")}</CardTitle>
          <CardDescription>{t("settings.clinic.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">{t("settings.clinic.name")}:</span> {user?.clinic?.name}</p>
          <p><span className="text-muted-foreground">{t("settings.clinic.email")}:</span> {user?.clinic?.email}</p>
          <p><span className="text-muted-foreground">{t("settings.clinic.phone")}:</span> {user?.clinic?.phone}</p>
          <p><span className="text-muted-foreground">{t("settings.clinic.address")}:</span> {user?.clinic?.address}</p>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{t("settings.team.title")}</CardTitle>
            <CardDescription>{t("settings.team.description")}</CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setUserFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t("settings.team.addUser")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.team.name")}</TableHead>
                <TableHead>{t("settings.team.email")}</TableHead>
                <TableHead>{t("settings.team.role")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("settings.billing.pricingPlans")}</h2>
          {hasActiveSub && (
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={billingLoading === "portal"}>
              {billingLoading === "portal" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-1" />
              )}
              {t("settings.billing.manageSubscription")}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const style = PLAN_STYLE[plan.key] ?? PLAN_STYLE.starter;
            const isCurrent = currentPlan === plan.key && hasActiveSub;
            const planKey = plan.key as "starter" | "growth" | "clinic";
            return (
              <div
                key={plan.key}
                className={`rounded-xl border-2 p-4 sm:p-6 relative ${style.color} ${isCurrent ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
              >
                {style.popular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {t("settings.billing.mostPopular")}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {t("settings.billing.currentPlan")}
                  </span>
                )}
                <div className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${style.badge}`}>
                  {plan.name}
                </div>
                <p className="text-2xl font-bold mt-1">${plan.amount}<span className="text-sm font-normal text-muted-foreground">{t("settings.billing.perMonth")}</span></p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
                <ul className="space-y-2">
                  {style.featureKeys.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-5"
                  variant={isCurrent ? "secondary" : style.popular ? "default" : "outline"}
                  disabled={isCurrent || !!isDemo || billingLoading === plan.key}
                  onClick={() => !isCurrent && !isDemo && handleGetStarted(planKey)}
                >
                  {billingLoading === plan.key ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("settings.billing.redirecting")}</>
                  ) : isCurrent ? (
                    t("settings.billing.currentPlan")
                  ) : (
                    t("settings.billing.getStarted")
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        {isDemo && (
          <p className="text-xs text-muted-foreground mt-3">
            {t("settings.billing.demoCheckoutDisabled")}
          </p>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {t("settings.security.title")}
          </CardTitle>
          <CardDescription>
            {isDemo
              ? t("settings.security.demoDescription")
              : t("settings.security.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          {isDemo ? (
            <p className="text-sm text-muted-foreground italic">
              {t("settings.security.demoUpgradeNote")}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {user?.two_factor_enabled ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-700">{t("settings.security.statusEnabled")}</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="text-sm text-muted-foreground">{t("settings.security.statusDisabled")}</span>
                  </>
                )}
              </div>
              {user?.two_factor_enabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => { setTwoFACode(""); setTwoFAStep("confirm-disable"); }}
                >
                  <ShieldOff className="h-4 w-4 mr-1" /> {t("settings.security.disable")}
                </Button>
              ) : (
                <Button size="sm" onClick={start2FASetup}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> {t("settings.security.enable")}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog — QR Code */}
      <Dialog open={twoFAStep === "qr"} onOpenChange={(o) => !o && setTwoFAStep("idle")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.security.setupTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg border" />
              </div>
            )}
            <div className="bg-slate-50 rounded-md p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("settings.security.manualKey")}</p>
              <p className="font-mono text-sm tracking-widest break-all select-all">{twoFASecret}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTwoFAStep("idle")}>{t("common.cancel")}</Button>
              <Button onClick={() => { setTwoFACode(""); setTwoFAStep("confirm-enable"); }}>
                {t("settings.security.scanned")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Confirm Enable Dialog */}
      <Dialog open={twoFAStep === "confirm-enable"} onOpenChange={(o) => !o && setTwoFAStep("idle")}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.security.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{t("settings.security.confirmDescription")}</p>
          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-xl tracking-[0.4em] font-mono h-12"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTwoFAStep("qr")}>{t("common.back")}</Button>
              <Button onClick={confirmEnable2FA} disabled={twoFACode.length !== 6}>
                {t("settings.security.activate")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Confirm Disable Dialog */}
      <Dialog open={twoFAStep === "confirm-disable"} onOpenChange={(o) => !o && setTwoFAStep("idle")}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.security.disableTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">{t("settings.security.disableDescription")}</p>
          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-xl tracking-[0.4em] font-mono h-12"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTwoFAStep("idle")}>{t("common.cancel")}</Button>
              <Button
                variant="destructive"
                onClick={confirmDisable2FA}
                disabled={twoFACode.length !== 6}
              >
                {t("settings.security.disableButton")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.team.createTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.team.name")}</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("settings.team.email")}</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("settings.team.password")}</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("settings.team.role")}</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("settings.team.selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("settings.team.roleAdmin")}</SelectItem>
                      <SelectItem value="doctor">{t("settings.team.roleDoctor")}</SelectItem>
                      <SelectItem value="staff">{t("settings.team.roleStaff")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setUserFormOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("settings.team.creating") : t("settings.team.createUser")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
