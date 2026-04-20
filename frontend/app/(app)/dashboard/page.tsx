"use client";

import useSWR from "swr";
import { dashboardApi } from "@/lib/api";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, statusColor } from "@/lib/utils";
import { Calendar, Users, Clock, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/types";

const fetcher = () => dashboardApi.stats().then((r) => r.data);

export default function DashboardPage() {
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
        <span>Failed to load dashboard data.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your clinic activity
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Appointments"
          value={data?.today_count ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Patients"
          value={data?.total_patients ?? 0}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="This Month"
          value={data?.monthly_count ?? 0}
          icon={<Calendar className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          title="Pending Confirmation"
          value={data?.pending_count ?? 0}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.upcoming?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No upcoming appointments
            </p>
          ) : (
            <div className="space-y-3">
              {data.upcoming.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{appt.patient?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Dr. {appt.doctor?.name} · {formatDateTime(appt.datetime)}
                    </p>
                  </div>
                  <Badge className={statusColor(appt.status)} variant="outline">
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
