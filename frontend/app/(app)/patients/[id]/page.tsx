"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { patientsApi, medicalRecordsApi, usersApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MedicalRecordForm, toFormDefaults, type MedicalRecordFormData } from "@/components/MedicalRecordForm";
import { formatDate, formatDateTime, getInitials, statusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  FileText,
  Plus,
  Droplets,
  AlertCircle,
  HeartPulse,
  User,
  MapPin,
  ShieldCheck,
  Briefcase,
  ClipboardList,
  Stethoscope,
  Pencil,
  Trash2,
} from "lucide-react";
import type { PatientHistory, MedicalRecord, User as UserType } from "@/types";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium text-slate-800">{value}</span>
      </div>
    </div>
  );
}

function VitalBadge({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: history, isLoading, mutate } = useSWR<PatientHistory>(
    id ? `patients/${id}/history` : null,
    () => patientsApi.history(id).then((r) => r.data)
  );

  const { data: users } = useSWR<UserType[]>(
    "users",
    () => usersApi.list().then((r) => r.data)
  );

  const doctors = (users ?? []).filter((u) => u.role === "doctor");
  const patient = history?.patient;
  const records = history?.records ?? [];

  const openNewRecord = () => {
    setEditingRecord(null);
    setRecordDialogOpen(true);
  };

  const openEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record);
    setRecordDialogOpen(true);
  };

  const handleRecordSubmit = async (data: MedicalRecordFormData) => {
    setIsSubmitting(true);
    const vitalSigns = {
      blood_pressure: data.blood_pressure,
      temperature: data.temperature,
      heart_rate: data.heart_rate,
      weight: data.weight,
      height: data.height,
      oxygen_saturation: data.oxygen_saturation,
    };
    try {
      if (editingRecord) {
        await medicalRecordsApi.update(id, editingRecord.id, {
          chief_complaint: data.chief_complaint,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          prescriptions: data.prescriptions,
          vital_signs: vitalSigns,
          follow_up_date: data.follow_up_date,
          notes: data.notes,
        });
        toast({ title: "Visit record updated" });
      } else {
        await medicalRecordsApi.create(id, {
          doctor_id: data.doctor_id,
          visit_date: data.visit_date,
          chief_complaint: data.chief_complaint,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          prescriptions: data.prescriptions,
          vital_signs: vitalSigns,
          follow_up_date: data.follow_up_date,
          notes: data.notes,
        });
        toast({ title: "Visit record created" });
      }
      mutate();
      setRecordDialogOpen(false);
    } catch {
      toast({ title: "Failed to save record", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Delete this visit record?")) return;
    try {
      await medicalRecordsApi.remove(id, recordId);
      toast({ title: "Record deleted" });
      mutate();
    } catch {
      toast({ title: "Failed to delete record", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-5xl">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-10 w-72 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!patient) {
    return <p className="text-muted-foreground">Patient not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
            {getInitials(patient.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.dob ? `Born ${formatDate(patient.dob)}` : "No DOB recorded"}
            {patient.gender ? ` · ${patient.gender}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Visit History
            {records.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                {records.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" /> Appointments
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ───────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Phone} label="Phone" value={patient.phone} />
                <InfoRow icon={Mail} label="Email" value={patient.email} />
                <InfoRow icon={MapPin} label="Address" value={patient.address} />
                <InfoRow icon={Briefcase} label="Occupation" value={patient.occupation} />
                {patient.notes && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-slate-700">{patient.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Medical Profile */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Medical Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Droplets} label="Blood Type" value={patient.blood_type} />
                <InfoRow icon={AlertCircle} label="Allergies" value={patient.allergies} />
                <InfoRow icon={HeartPulse} label="Chronic Conditions" value={patient.chronic_conditions} />
                <InfoRow icon={ShieldCheck} label="Insurance" value={patient.insurance} />
                {!patient.blood_type && !patient.allergies && !patient.chronic_conditions && !patient.insurance && (
                  <p className="text-sm text-muted-foreground italic">No medical profile information recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-6 text-sm">
                  <InfoRow icon={User} label="Name" value={patient.emergency_contact_name} />
                  <InfoRow icon={Phone} label="Phone" value={patient.emergency_contact_phone} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Visit History Tab ─────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {records.length} visit{records.length !== 1 ? "s" : ""} recorded
            </p>
            <Button size="sm" onClick={openNewRecord}>
              <Plus className="h-4 w-4 mr-1.5" /> New Visit Record
            </Button>
          </div>

          {records.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Stethoscope className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">No visit records yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create the first visit record for this patient.
                </p>
                <Button className="mt-4" size="sm" onClick={openNewRecord}>
                  <Plus className="h-4 w-4 mr-1.5" /> New Visit Record
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(record.visit_date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {record.doctor?.name ?? "—"}
                          {record.chief_complaint ? ` · ${record.chief_complaint}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {record.follow_up_date && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Follow-up: {formatDate(record.follow_up_date)}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditRecord(record)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      {record.diagnosis && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Diagnosis
                          </p>
                          <p className="text-slate-800">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.treatment && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Treatment
                          </p>
                          <p className="text-slate-800">{record.treatment}</p>
                        </div>
                      )}
                      {record.prescriptions && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Prescriptions
                          </p>
                          <p className="text-slate-800">{record.prescriptions}</p>
                        </div>
                      )}
                    </div>

                    {record.vital_signs && Object.values(record.vital_signs).some(Boolean) && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Vital Signs
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <VitalBadge label="Blood Pressure" value={record.vital_signs.blood_pressure} />
                            <VitalBadge label="Temperature" value={record.vital_signs.temperature} />
                            <VitalBadge label="Heart Rate" value={record.vital_signs.heart_rate} />
                            <VitalBadge label="Weight" value={record.vital_signs.weight} />
                            <VitalBadge label="Height" value={record.vital_signs.height} />
                            <VitalBadge label="O₂ Sat." value={record.vital_signs.oxygen_saturation} />
                          </div>
                        </div>
                      </>
                    )}

                    {record.notes && (
                      <>
                        <Separator />
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-md p-3">{record.notes}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Appointments Tab ──────────────────────────────────── */}
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {!patient.appointments?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No appointments yet.
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
                        <TableCell className="font-medium">
                          {formatDateTime(appt.datetime)}
                        </TableCell>
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
        </TabsContent>
      </Tabs>

      {/* Medical Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "Edit Visit Record" : "New Visit Record"}
            </DialogTitle>
          </DialogHeader>
          <MedicalRecordForm
            doctors={doctors}
            defaultValues={editingRecord ? toFormDefaults(editingRecord) : undefined}
            isSubmitting={isSubmitting}
            onSubmit={handleRecordSubmit}
            onCancel={() => setRecordDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
