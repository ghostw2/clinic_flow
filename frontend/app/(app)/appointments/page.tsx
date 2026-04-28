"use client";

import { useState } from "react";
import useSWR from "swr";
import { appointmentsApi, usersApi } from "@/lib/api";
import { CalendarView } from "@/components/Calendar";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Plus, Calendar, List, X } from "lucide-react";
import type { Appointment, User } from "@/types";

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

  // List-view filters (client-side)
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");

  const doctors = users.filter((u) => u.role === "doctor");
  const hasFilters = dateFilter || statusFilter || doctorFilter;

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("");
    setDoctorFilter("");
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

  const handleDelete = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    await appointmentsApi.remove(id);
    mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule and manage patient appointments
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Appointment
        </Button>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-1" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-1" /> List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            appointments={appointments}
            onEventClick={(appt) => handleEdit(appt)}
            onDateClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-3">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="w-40"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All doctors" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dr. {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
            {hasFilters && (
              <span className="text-sm text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell className="font-medium">
                          {appt.patient?.name ?? "—"}
                        </TableCell>
                        <TableCell>Dr. {appt.doctor?.name ?? "—"}</TableCell>
                        <TableCell>{formatDateTime(appt.datetime)}</TableCell>
                        <TableCell>{appt.duration} min</TableCell>
                        <TableCell>
                          <Badge className={statusColor(appt.status)} variant="outline">
                            {appt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(appt)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(appt.id)}
                          >
                            Cancel
                          </Button>
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
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}
