"use client";

import { ChevronLeft, ChevronRight, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AppointmentDayCard } from "@/components/AppointmentDayCard";
import type { Appointment } from "@/types";

const DOCTOR_COLORS = [
  "#1a73e8", "#34a853", "#f59e0b", "#9333ea",
  "#0891b2", "#dc2626", "#16a34a", "#7c3aed",
];

export function doctorColor(doctorId: string): string {
  let h = 0;
  for (const c of doctorId) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return DOCTOR_COLORS[h % DOCTOR_COLORS.length];
}

function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface DayScheduleViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  onCardClick?: (appt: Appointment) => void;
  isLoading?: boolean;
}

export function DayScheduleView({
  appointments,
  selectedDate,
  onDateChange,
  onCardClick,
  isLoading,
}: DayScheduleViewProps) {
  const key = toDateKey(selectedDate);

  const dayAppts = [...appointments]
    .filter((a) => a.datetime.startsWith(key))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));

  const label = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const prev = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const next = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={prev} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {dayAppts.length} appointment{dayAppts.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={next} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : dayAppts.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No appointments"
          description="Nothing scheduled for this day."
        />
      ) : (
        <div className="space-y-2">
          {dayAppts.map((appt) => (
            <AppointmentDayCard
              key={appt.id}
              appointment={appt}
              doctorColor={doctorColor(appt.doctor_id)}
              onClick={onCardClick ? () => onCardClick(appt) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
