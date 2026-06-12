"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { Appointment } from "@/types";

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: "#fff8e1", border: "#f59e0b", text: "#78350f" },
  confirmed: { bg: "#e8f0fe", border: "#1a73e8", text: "#1a3a6e" },
  completed: { bg: "#e6f4ea", border: "#34a853", text: "#1e4d2b" },
  cancelled: { bg: "#fce8e6", border: "#ea4335", text: "#7c1c14" },
};

function EventContent({ info }: { info: EventContentArg }) {
  const appt = info.event.extendedProps.appointment as Appointment;
  const colors = STATUS_COLORS[appt.status] ?? { bg: "#f1f5f9", border: "#94a3b8", text: "#475569" };
  const isMonth = info.view.type === "dayGridMonth";

  if (isMonth) {
    return (
      <div
        style={{
          backgroundColor: colors.border,
          color: "white",
          padding: "1px 5px",
          borderRadius: "3px",
          fontSize: "0.7rem",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
      >
        {info.timeText && <span style={{ marginRight: 3, opacity: 0.85 }}>{info.timeText}</span>}
        {appt.patient?.name ?? "Patient"}
      </div>
    );
  }

  return (
    <div
      className="gc-event"
      style={{ borderLeftColor: colors.border, backgroundColor: colors.bg, color: colors.text }}
    >
      {info.timeText && <span className="gc-event-time">{info.timeText}</span>}
      <span className="gc-event-title">{appt.patient?.name ?? "Patient"}</span>
      {appt.doctor?.name && (
        <span className="gc-event-doctor">Dr. {appt.doctor.name}</span>
      )}
    </div>
  );
}

interface CalendarViewProps {
  appointments: Appointment[];
  onEventClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({ appointments, onEventClick, onDateClick }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(isMobile ? "dayGridMonth" : "timeGridWeek");
  }, [isMobile]);

  const goToDay = useCallback((date: Date) => {
    calendarRef.current?.getApi().changeView("timeGridDay", date);
  }, []);

  const handleDateClick = useCallback((info: DateClickArg) => {
    const viewType = calendarRef.current?.getApi().view.type;
    if (viewType === "timeGridDay") {
      // In day view — open the new appointment form with this time pre-filled
      onDateClick?.(info.date);
    } else {
      // In month or week view — drill into that day
      goToDay(info.date);
    }
  }, [goToDay, onDateClick]);

  const now = new Date();
  const scrollHour = Math.max(7, now.getHours() - 1);
  const scrollTime = `${String(scrollHour).padStart(2, "0")}:00:00`;

  const events = appointments.map((appt) => ({
    id: appt.id,
    title: appt.patient?.name ?? "Patient",
    start: appt.datetime,
    duration: { minutes: appt.duration },
    backgroundColor: "transparent",
    borderColor: "transparent",
    extendedProps: { appointment: appt },
  }));

  return (
    <div className="gc-calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? "dayGridMonth" : "timeGridWeek"}
        headerToolbar={
          isMobile
            ? { left: "prev,next", center: "title", right: "today" }
            : { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }
        }
        buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day" }}
        events={events}
        eventClick={(info: EventClickArg) => {
          onEventClick?.(info.event.extendedProps.appointment as Appointment);
        }}
        dateClick={handleDateClick}
        eventContent={(info) => <EventContent info={info} />}
        // Day headers in week view: click navigates to that day
        dayHeaderContent={(args) => {
          const day = args.date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
          const num = args.date.getDate();
          const isWeekView = calendarRef.current?.getApi().view.type === "timeGridWeek";
          return (
            <div
              className="gc-day-header"
              style={{ cursor: isWeekView ? "pointer" : "default" }}
              onClick={() => isWeekView && goToDay(args.date)}
            >
              <span className="gc-day-weekday">{day}</span>
              <span className={`gc-day-num${args.isToday ? " gc-today-num" : ""}`}>{num}</span>
            </div>
          );
        }}
        // Month view: clicking the day number navigates to day view
        navLinks={true}
        navLinkDayClick={(date, jsEvent) => {
          jsEvent.preventDefault();
          goToDay(date);
        }}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={{ hour: "numeric", minute: "2-digit", omitZeroMinute: true, meridiem: "short" }}
        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
        allDaySlot={false}
        nowIndicator={true}
        scrollTime={scrollTime}
        stickyHeaderDates={true}
        businessHours={{ daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "18:00" }}
        dayMaxEvents={3}
        height={isMobile ? "auto" : "calc(100vh - 220px)"}
      />
    </div>
  );
}
