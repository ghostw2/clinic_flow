"use client";

import { useState } from "react";
import useSWR from "swr";
import { usersApi, authApi } from "@/lib/api";
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
import { Plus, Check, ShieldCheck, ShieldOff } from "lucide-react";
import type { User } from "@/types";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.enum(["admin", "doctor", "staff"]),
});
type UserForm = z.infer<typeof userSchema>;

const PLANS = [
  {
    name: "Starter",
    price: "$29/month",
    description: "Perfect for solo practitioners",
    features: ["1 doctor", "Up to 100 patients", "Email reminders", "Calendar view"],
    color: "bg-slate-50 border-slate-200",
    badge: "bg-slate-100 text-slate-700",
  },
  {
    name: "Growth",
    price: "$59/month",
    description: "Growing clinics",
    features: ["Up to 5 doctors", "Unlimited patients", "Email reminders", "Priority queue"],
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    popular: true,
  },
  {
    name: "Clinic",
    price: "$99/month",
    description: "Large clinics & multi-doctor",
    features: ["Unlimited doctors", "Unlimited patients", "SMS + Email reminders", "Priority support"],
    color: "bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
  },
];

type TwoFAStep = "idle" | "qr" | "confirm-enable" | "confirm-disable";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [userFormOpen, setUserFormOpen] = useState(false);

  // 2FA state
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");

  const { data: users = [], mutate } = useSWR<User[]>("users", () =>
    usersApi.list().then((r) => r.data)
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema) });

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
        <h2 className="text-lg font-semibold mb-4">Pricing Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border-2 p-6 relative ${plan.color}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <div className={`inline-block text-xs font-semibold px-2 py-1 rounded mb-3 ${plan.badge}`}>
                {plan.name}
              </div>
              <p className="text-2xl font-bold mt-1">{plan.price}</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-5" variant={plan.popular ? "default" : "outline"}>
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
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
                I've scanned it
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
