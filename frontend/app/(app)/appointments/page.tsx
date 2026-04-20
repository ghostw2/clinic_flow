"use client";

import { useState } from "react";
import useSWR from "swr";
import { appointmentsApi } from "@/lib/api";
import { CalendarView } from "@/components/Calendar";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, statusColor } from "@/lib/utils";
import { Plus, Calendar, List } from "lucide-react";
import type { Appointment } from "@/types";

const fetcher = () => appointmentsApi.list().then((r) => r.data);

export default function AppointmentsPage() {
  const { data: appointments = [], mutate, isLoading } = useSWR<Appointment[]>(
    "appointments",
    fetcher
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

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
            onDateClick={(date) => {
              setEditing(null);
              setFormOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
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
                  {appointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No appointments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    appointments.map((appt) => (
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
