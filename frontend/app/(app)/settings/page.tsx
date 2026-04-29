"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { usersApi, authApi, billingApi } from "@/lib/api";

type PlanInfo = { key: string; name: string; amount: string; description: string };
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

const PLAN_STYLE: Record<string, { color: string; badge: string; popular?: boolean; features: string[] }> = {
  starter: {
    color: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-700",
    features: ["1 doctor", "Up to 100 patients", "Email reminders", "Calendar view"],
  },
  growth: {
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    popular: true,
    features: ["Up to 5 doctors", "Unlimited patients", "Email reminders", "Priority queue"],
  },
  clinic: {
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    features: ["Unlimited doctors", "Unlimited patients", "SMS + Email reminders", "Priority support"],
  },
};

type TwoFAStep = "idle" | "qr" | "confirm-enable" | "confirm-disable";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);

  // 2FA state
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

  // Detect Stripe redirect-back success
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("payment=success")) {
      toast({ title: "Subscription activated!", description: "Your plan is now active." });
      window.history.replaceState({}, "", "/settings");
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateUser = async (values: UserForm) => {
    try {
      await usersApi.create(values);
      toast({ title: "User created successfully" });
      mutate();
      setUserFormOpen(false);
      reset();
    } catch {
      toast({ title: "Failed to create user", variant: "destructive" });
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
      toast({ title: "Failed to start 2FA setup", variant: "destructive" });
    }
  };

  const confirmEnable2FA = async () => {
    try {
      await authApi.enable2FA(twoFACode);
      await refreshUser();
      toast({ title: "Two-factor authentication enabled" });
      setTwoFAStep("idle");
      setTwoFACode("");
    } catch {
      toast({ title: "Invalid code. Try again.", variant: "destructive" });
      setTwoFACode("");
    }
  };

  const confirmDisable2FA = async () => {
    try {
      await authApi.disable2FA(twoFACode);
      await refreshUser();
      toast({ title: "Two-factor authentication disabled" });
      setTwoFAStep("idle");
      setTwoFACode("");
    } catch {
      toast({ title: "Invalid code. Try again.", variant: "destructive" });
      setTwoFACode("");
    }
  };

  const handleGetStarted = async (planKey: "starter" | "growth" | "clinic") => {
    setBillingLoading(planKey);
    try {
      const { data } = await billingApi.createCheckout(planKey);
      window.location.href = data.url;
    } catch {
      toast({ title: "Failed to start checkout", variant: "destructive" });
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
        toast({ title: "No active subscription", description: "Subscribe to a plan to manage billing.", variant: "destructive" });
      } else {
        toast({ title: "Failed to open billing portal", variant: "destructive" });
      }
      setBillingLoading(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage clinic settings, users, and subscription
        </p>
      </div>

      {/* Clinic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clinic Information</CardTitle>
          <CardDescription>Your clinic details from the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {user?.clinic?.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {user?.clinic?.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {user?.clinic?.phone}</p>
          <p><span className="text-muted-foreground">Address:</span> {user?.clinic?.address}</p>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Team Members</CardTitle>
            <CardDescription>Users with access to this clinic</CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setUserFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pricing Plans</h2>
          {hasActiveSub && (
            <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={billingLoading === "portal"}>
              {billingLoading === "portal" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-1" />
              )}
              Manage Subscription
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const style = PLAN_STYLE[plan.key] ?? PLAN_STYLE.starter;
            const isCurrent = currentPlan === plan.key && hasActiveSub;
            const planKey = plan.key as "starter" | "growth" | "clinic";
            return (
              <div
                key={plan.key}
                className={`rounded-xl border-2 p-6 relative ${style.color} ${isCurrent ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
              >
                {style.popular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Current Plan
                  </span>
                )}
                <div className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${style.badge}`}>
                  {plan.name}
                </div>
                <p className="text-2xl font-bold mt-1">${plan.amount}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
                <ul className="space-y-2">
                  {style.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {f}
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
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Redirecting…</>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        {isDemo && (
          <p className="text-xs text-muted-foreground mt-3">
            Checkout is disabled on demo accounts.
          </p>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            {isDemo
              ? "Two-factor authentication is not available on demo accounts"
              : "Add an extra layer of security to your account using an authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          {isDemo ? (
            <p className="text-sm text-muted-foreground italic">
              Upgrade to a paid plan to enable 2FA on your account.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {user?.two_factor_enabled && user?.two_factor_verified ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-700">Enabled</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="text-sm text-muted-foreground">Not enabled</span>
                  </>
                )}
              </div>
              {user?.two_factor_enabled && user?.two_factor_verified ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => { setTwoFACode(""); setTwoFAStep("confirm-disable"); }}
                >
                  <ShieldOff className="h-4 w-4 mr-1" /> Disable
                </Button>
              ) : (
                <Button size="sm" onClick={start2FASetup}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Enable 2FA
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
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with Google Authenticator, Authy, or any TOTP app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg border" />
              </div>
            )}
            <div className="bg-slate-50 rounded-md p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Manual entry key</p>
              <p className="font-mono text-sm tracking-widest break-all select-all">{twoFASecret}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setTwoFAStep("idle")}>Cancel</Button>
              <Button onClick={() => { setTwoFACode(""); setTwoFAStep("confirm-enable"); }}>
                I&apos;ve scanned it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Confirm Enable Dialog */}
      <Dialog open={twoFAStep === "confirm-enable"} onOpenChange={(o) => !o && setTwoFAStep("idle")}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm your authenticator</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your app to activate 2FA.
            </DialogDescription>
          </DialogHeader>
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
              <Button variant="outline" onClick={() => setTwoFAStep("qr")}>Back</Button>
              <Button onClick={confirmEnable2FA} disabled={twoFACode.length !== 6}>
                Activate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Confirm Disable Dialog */}
      <Dialog open={twoFAStep === "confirm-disable"} onOpenChange={(o) => !o && setTwoFAStep("idle")}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current 6-digit code to confirm.
            </DialogDescription>
          </DialogHeader>
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
              <Button variant="outline" onClick={() => setTwoFAStep("idle")}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={confirmDisable2FA}
                disabled={twoFACode.length !== 6}
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setUserFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
