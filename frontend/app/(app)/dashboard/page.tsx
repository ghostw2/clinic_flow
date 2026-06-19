"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/i18nContext";
import { useToast } from "@/components/ui/use-toast";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { AppointmentDayCard } from "@/components/AppointmentDayCard";
import { doctorColor } from "@/components/DayScheduleView";
import type { DashboardStats } from "@/types";

const fetcher = () => dashboardApi.stats().then((r) => r.data);

export default function DashboardPage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("payment=success")) {
      toast({ title: "Welcome!", description: "Your subscription is now active." });
      window.history.replaceState({}, "", "/dashboard");
      refreshUser();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, error } = useSWR<DashboardStats>("dashboard/stats", fetcher, {
    refreshInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>{t("dashboard.loadError")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("dashboard.todayAppointments")}
          value={data?.today_count ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title={t("dashboard.totalPatients")}
          value={data?.total_patients ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title={t("dashboard.thisMonth")}
          value={data?.monthly_count ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          title={t("dashboard.pendingConfirmation")}
          value={data?.pending_count ?? 0}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t("dashboard.upcomingAppointments")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.upcoming?.length ? (
            <EmptyState
              icon={Calendar}
              title={t("dashboard.noUpcoming")}
              description="Schedule an appointment to see it here."
            />
          ) : (
            <div className="space-y-2">
              {data.upcoming.map((appt) => (
                <AppointmentDayCard
                  key={appt.id}
                  appointment={appt}
                  doctorColor={doctorColor(appt.doctor_id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
