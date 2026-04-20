"use client";

import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { Appointment } from "@/types";
import { Card } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

interface CalendarViewProps {
  appointments: Appointment[];
  onEventClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({ appointments, onEventClick, onDateClick }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const events = appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.patient?.name ?? "Patient"} · Dr. ${appt.doctor?.name ?? ""}`,
    start: appt.datetime,
    duration: { minutes: appt.duration },
    backgroundColor: STATUS_COLORS[appt.status] ?? "#94a3b8",
    borderColor: STATUS_COLORS[appt.status] ?? "#94a3b8",
    extendedProps: { appointment: appt },
  }));

  const handleEventClick = (info: EventClickArg) => {
    const appt = info.event.extendedProps.appointment as Appointment;
    onEventClick?.(appt);
  };

  const handleDateClick = (info: DateClickArg) => {
    onDateClick?.(info.date);
  };

  return (
    <Card className="p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        height="auto"
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: "short" }}
      />
    </Card>
  );
}
