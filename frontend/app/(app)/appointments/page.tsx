"use client";

import { useState } from "react";
import useSWR from "swr";
import { appointmentsApi, usersApi } from "@/lib/api";
import { downloadCSV, downloadExcel } from "@/lib/export";
import { CalendarView } from "@/components/Calendar";
import { AppointmentForm } from "@/components/AppointmentForm";
import { AppointmentDetailSheet } from "@/components/AppointmentDetailSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, statusColor } from "@/lib/utils";
import { useI18n } from "@/contexts/i18nContext";
import { Plus, Calendar, List, X, Download, FileSpreadsheet, FileText } from "lucide-react";
import type { Appointment, User } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";

export default function AppointmentsPage() {
  const { data: appointments = [], mutate, isLoading } = useSWR<Appointment[]>(
    "appointments",
    () => appointmentsApi.list().then((r) => r.data)
  );

  const { data: users = [] } = useSWR<User[]>("users", () =>
    usersApi.list().then((r) => r.data)
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [detailAppt, setDetailAppt] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  const { t } = useI18n();
  const { can } = usePermissions();

  const doctors = users.filter((u) => u.role === "doctor");
  const hasFilters = dateFilter || statusFilter || doctorFilter;

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("");
    setDoctorFilter("");
  };

  const handleExport = (format: "csv" | "excel") => {
    const headers = ["Patient", "Doctor", "Date & Time", "Duration (min)", "Status", "Notes"];
    const rows = filtered.map((appt) => [
      appt.patient?.name ?? "",
      appt.doctor?.name ? `Dr. ${appt.doctor.name}` : "",
      formatDateTime(appt.datetime),
      appt.duration,
      appt.status,
      appt.notes ?? "",
    ]);
    const filename = `appointments_${new Date().toISOString().slice(0, 10)}`;
    if (format === "csv") downloadCSV(filename, headers, rows);
    else downloadExcel(filename, headers, rows);
  };

  const filtered = appointments.filter((appt) => {
    if (statusFilter && appt.status !== statusFilter) return false;
    if (doctorFilter && appt.doctor_id !== doctorFilter) return false;
    if (dateFilter && !appt.datetime.startsWith(dateFilter)) return false;
    return true;
  });

  const handleSaved = () => {
    mutate();
    setFormOpen(false);
    setEditing(null);
  };

  const handleEdit = (appt: Appointment) => {
    setEditing(appt);
    setFormOpen(true);
  };

  const handleDetailOpen = (appt: Appointment) => {
    setDetailAppt(appt);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("appointments.cancelConfirm"))) return;
    await appointmentsApi.remove(id);
    mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("appointments.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("appointments.subtitle")}</p>
        </div>
        {can("appointment.create") && (
          <Button onClick={() => { setEditing(null); setSelectedDate(undefined); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> {t("appointments.newAppointment")}
          </Button>
        )}
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-1" /> {t("appointments.calendar")}
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-1" /> {t("appointments.list")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            appointments={appointments}
            onEventClick={(appt) => handleDetailOpen(appt)}
            onDateClick={(date) => {
              setEditing(null);
              setSelectedDate(date);
              setFormOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-3">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="w-full sm:w-40"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t("appointments.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("appointments.statuses.pending")}</SelectItem>
                <SelectItem value="confirmed">{t("appointments.statuses.confirmed")}</SelectItem>
                <SelectItem value="completed">{t("appointments.statuses.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("appointments.statuses.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t("appointments.allDoctors")} />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {t("common.dr")} {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> {t("common.clear")}
              </Button>
            )}
            {hasFilters && (
              <span className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length !== 1 ? t("common.results_plural", { count: "" }).replace("{{count}} ", "") : t("common.results", { count: "" }).replace("{{count}} ", "")}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1.5" /> {t("common.export")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="h-4 w-4 mr-2" /> Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-white overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("appointments.table.patient")}</TableHead>
                    <TableHead>{t("appointments.table.doctor")}</TableHead>
                    <TableHead>{t("appointments.table.dateTime")}</TableHead>
                    <TableHead>{t("appointments.table.duration")}</TableHead>
                    <TableHead>{t("appointments.table.status")}</TableHead>
                    <TableHead className="text-right">{t("appointments.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {t("appointments.noAppointments")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell className="font-medium">
                          {appt.patient?.name ?? "—"}
                        </TableCell>
                        <TableCell>{t("common.dr")} {appt.doctor?.name ?? "—"}</TableCell>
                        <TableCell>{formatDateTime(appt.datetime)}</TableCell>
                        <TableCell>{appt.duration} {t("common.min")}</TableCell>
                        <TableCell>
                          <Badge className={statusColor(appt.status)} variant="outline">
                            {t(`appointments.statuses.${appt.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {(can("appointment.update") || can("appointment.update_status")) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDetailOpen(appt)}
                            >
                              {t("common.edit")}
                            </Button>
                          )}
                          {can("appointment.delete") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(appt.id)}
                            >
                              {t("common.cancel")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AppointmentForm
        open={formOpen}
        appointment={editing}
        defaultDate={selectedDate}
        onClose={() => { setFormOpen(false); setEditing(null); setSelectedDate(undefined); }}
        onSaved={handleSaved}
      />

      <AppointmentDetailSheet
        appointment={detailAppt}
        onClose={() => setDetailAppt(null)}
        onSaved={() => { mutate(); setDetailAppt(null); }}
      />
    </div>
  );
}
