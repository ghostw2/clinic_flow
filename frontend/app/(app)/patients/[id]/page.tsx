"use client";

import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { patientsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDateTime, statusColor } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, Calendar, FileText } from "lucide-react";
import type { Patient } from "@/types";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: patient, isLoading } = useSWR<Patient>(
    id ? `patients/${id}` : null,
    () => patientsApi.get(id).then((r) => r.data)
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!patient) {
    return <p className="text-muted-foreground">Patient not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
          <p className="text-muted-foreground text-sm">Patient Profile</p>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>DOB: </span>
            <span className="text-foreground font-medium">
              {patient.dob ? formatDate(patient.dob) : "Not provided"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{patient.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{patient.email || "—"}</span>
          </div>
          {patient.notes && (
            <div className="flex items-start gap-2 text-muted-foreground col-span-full">
              <FileText className="h-4 w-4 mt-0.5" />
              <span className="text-foreground">{patient.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment History</CardTitle>
        </CardHeader>
        <CardContent>
          {!patient.appointments?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No appointments yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>{formatDateTime(appt.datetime)}</TableCell>
                    <TableCell>Dr. {appt.doctor?.name ?? "—"}</TableCell>
                    <TableCell>{appt.duration} min</TableCell>
                    <TableCell>
                      <Badge className={statusColor(appt.status)} variant="outline">
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {appt.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
