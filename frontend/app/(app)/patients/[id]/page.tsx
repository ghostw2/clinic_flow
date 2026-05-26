"use client";

import { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { patientsApi, medicalRecordsApi, usersApi } from "@/lib/api";
import { useI18n } from "@/contexts/i18nContext";
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
import type { Patient, PatientHistory, MedicalRecord, User as UserType } from "@/types";

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
  const { t } = useI18n();

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: patient, isLoading: patientLoading } = useSWR<Patient>(
    id ? `patients/${id}` : null,
    () => patientsApi.get(id).then((r) => r.data)
  );

  const { data: history, mutate } = useSWR<PatientHistory>(
    id ? `patients/${id}/history` : null,
    () => patientsApi.history(id).then((r) => r.data)
  );

  const { data: users } = useSWR<UserType[]>(
    "users",
    () => usersApi.list().then((r) => r.data)
  );

  const doctors = (users ?? []).filter((u) => u.role === "doctor");
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
        toast({ title: t("patients.detail.toast.recordUpdated") });
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
        toast({ title: t("patients.detail.toast.recordCreated") });
      }
      mutate();
      setRecordDialogOpen(false);
    } catch {
      toast({ title: t("patients.detail.toast.recordSaveFailed"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm(t("patients.detail.deleteConfirm"))) return;
    try {
      await medicalRecordsApi.remove(id, recordId);
      toast({ title: t("patients.detail.toast.recordDeleted") });
      mutate();
    } catch {
      toast({ title: t("patients.detail.toast.recordDeleteFailed"), variant: "destructive" });
    }
  };

  if (patientLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-5xl">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-10 w-72 bg-slate-100 rounded-lg" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!patient) {
    return <p className="text-muted-foreground">{t("patients.detail.notFound")}</p>;
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
            {patient.dob
              ? t("patients.detail.born", { date: formatDate(patient.dob) })
              : t("patients.detail.noDob")}
            {patient.gender ? ` · ${patient.gender}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" /> {t("patients.detail.tabProfile")}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <ClipboardList className="h-4 w-4" /> {t("patients.detail.tabHistory")}
            {records.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 leading-none">
                {records.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" /> {t("patients.detail.tabAppointments")}
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ───────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  {t("patients.detail.contactInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Phone} label={t("patients.form.phone")} value={patient.phone} />
                <InfoRow icon={Mail} label={t("patients.form.email")} value={patient.email} />
                <InfoRow icon={MapPin} label={t("patients.form.address")} value={patient.address} />
                <InfoRow icon={Briefcase} label={t("patients.form.occupation")} value={patient.occupation} />
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
                  {t("patients.detail.medicalProfile")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={Droplets} label={t("patients.form.bloodType")} value={patient.blood_type} />
                <InfoRow icon={AlertCircle} label={t("patients.form.allergies")} value={patient.allergies} />
                <InfoRow icon={HeartPulse} label={t("patients.form.chronicConditions")} value={patient.chronic_conditions} />
                <InfoRow icon={ShieldCheck} label={t("patients.form.insurance")} value={patient.insurance} />
                {!patient.blood_type && !patient.allergies && !patient.chronic_conditions && !patient.insurance && (
                  <p className="text-sm text-muted-foreground italic">{t("patients.detail.noMedicalInfo")}</p>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    {t("patients.detail.emergencyContact")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 text-sm">
                  <InfoRow icon={User} label={t("patients.form.emergencyContactName")} value={patient.emergency_contact_name} />
                  <InfoRow icon={Phone} label={t("patients.form.emergencyContactPhone")} value={patient.emergency_contact_phone} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Visit History Tab ─────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {records.length !== 1
                ? t("patients.detail.visitsRecorded_plural", { count: String(records.length) })
                : t("patients.detail.visitsRecorded", { count: String(records.length) })}
            </p>
            <Button size="sm" onClick={openNewRecord}>
              <Plus className="h-4 w-4 mr-1.5" /> {t("patients.detail.newRecord")}
            </Button>
          </div>

          {records.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Stethoscope className="h-10 w-10 text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">{t("patients.detail.noRecordsTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("patients.detail.noRecordsDesc")}</p>
                <Button className="mt-4" size="sm" onClick={openNewRecord}>
                  <Plus className="h-4 w-4 mr-1.5" /> {t("patients.detail.newRecord")}
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
                          {t("common.dr")} {record.doctor?.name ?? "—"}
                          {record.chief_complaint ? ` · ${record.chief_complaint}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {record.follow_up_date && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {t("patients.detail.followUp", { date: formatDate(record.follow_up_date) })}
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
                            {t("patients.detail.diagnosis")}
                          </p>
                          <p className="text-slate-800">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.treatment && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            {t("patients.detail.treatment")}
                          </p>
                          <p className="text-slate-800">{record.treatment}</p>
                        </div>
                      )}
                      {record.prescriptions && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            {t("patients.detail.prescriptions")}
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
                            {t("patients.detail.vitalSigns")}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            <VitalBadge label={t("records.bloodPressure")} value={record.vital_signs.blood_pressure} />
                            <VitalBadge label={t("records.temperature")} value={record.vital_signs.temperature} />
                            <VitalBadge label={t("records.heartRate")} value={record.vital_signs.heart_rate} />
                            <VitalBadge label={t("records.weight")} value={record.vital_signs.weight} />
                            <VitalBadge label={t("records.height")} value={record.vital_signs.height} />
                            <VitalBadge label={t("patients.detail.oxygenSatShort")} value={record.vital_signs.oxygen_saturation} />
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
                  {t("patients.detail.noAppointments")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("appointments.table.dateTime")}</TableHead>
                      <TableHead>{t("appointments.table.doctor")}</TableHead>
                      <TableHead>{t("appointments.table.duration")}</TableHead>
                      <TableHead>{t("appointments.table.status")}</TableHead>
                      <TableHead>{t("appointments.table.notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.appointments.map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell className="font-medium">
                          {formatDateTime(appt.datetime)}
                        </TableCell>
                        <TableCell>{t("common.dr")} {appt.doctor?.name ?? "—"}</TableCell>
                        <TableCell>{appt.duration} {t("common.min")}</TableCell>
                        <TableCell>
                          <Badge className={statusColor(appt.status)} variant="outline">
                            {t(`appointments.statuses.${appt.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {appt.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
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
              {editingRecord ? t("patients.detail.editRecord") : t("patients.detail.newRecord")}
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
