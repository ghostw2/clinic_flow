"use client";

import { Badge } from "@/components/ui/badge";
import { statusColor } from "@/lib/utils";
import type { Appointment } from "@/types";

interface AppointmentDayCardProps {
  appointment: Appointment;
  doctorColor: string;
  onClick?: () => void;
}

export function AppointmentDayCard({ appointment, doctorColor, onClick }: AppointmentDayCardProps) {
  const time = new Date(appointment.datetime).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 border border-border bg-card rounded-md px-4 py-3 ${
        onClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""
      }`}
      style={{ borderLeft: `4px solid ${doctorColor}` }}
    >
      <span className="text-sm font-semibold w-12 shrink-0 text-foreground">{time}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {appointment.patient?.name ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Dr. {appointment.doctor?.name ?? "—"} · {appointment.duration} min
        </p>
      </div>
      <Badge className={statusColor(appointment.status)} variant="outline">
        {appointment.status}
      </Badge>
    </div>
  );
}
