"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Stethoscope } from "lucide-react";

const schema = z
  .object({
    clinic_name: z.string().min(2, "Clinic name must be at least 2 characters"),
    admin_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await authApi.register({
        clinic_name: data.clinic_name,
        admin_name: data.admin_name,
        email: data.email,
        password: data.password,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Registration failed. Please try again.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary text-primary-foreground rounded-xl p-3">
            <Stethoscope className="h-7 w-7" />
          </div>
          <span className="text-3xl font-bold text-slate-900">ClinicFlow</span>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Set up your clinic and get started in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Clinic section */}
              <div className="space-y-2">
                <Label htmlFor="clinic_name">Clinic Name</Label>
                <Input
                  id="clinic_name"
                  placeholder="Sunshine Medical Clinic"
                  {...register("clinic_name")}
                />
                {errors.clinic_name && (
                  <p className="text-sm text-destructive">{errors.clinic_name.message}</p>
                )}
              </div>

              <Separator />

              {/* Admin section */}
              <div className="space-y-2">
                <Label htmlFor="admin_name">Your Full Name</Label>
                <Input
                  id="admin_name"
                  placeholder="Dr. Jane Smith"
                  {...register("admin_name")}
                />
                {errors.admin_name && (
                  <p className="text-sm text-destructive">{errors.admin_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@sunshine.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Repeat your password"
                  {...register("confirm_password")}
                />
                {errors.confirm_password && (
                  <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
