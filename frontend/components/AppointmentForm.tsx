"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import { appointmentsApi, patientsApi, usersApi } from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import type { Appointment, Patient, User } from "@/types";

const schema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  doctor_id: z.string().min(1, "Select a doctor"),
  datetime: z.string().min(1, "Date and time required"),
  duration: z.coerce.number().min(5).max(240).default(30),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface AppointmentFormProps {
  open: boolean;
  appointment?: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentForm({ open, appointment, onClose, onSaved }: AppointmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!appointment;

  const { data: patients = [] } = useSWR<{ patients: Patient[] }>(
    "patients-all",
    () => patientsApi.list({ page: 1 }).then((r) => r.data)
  );
  const { data: doctors = [] } = useSWR<User[]>(
    "users",
    () => usersApi.list().then((r) => r.data)
  );

  const doctorList = (Array.isArray(doctors) ? doctors : []).filter(
    (u) => u.role === "doctor" || u.role === "admin"
  );
  const patientList = patients && "patients" in patients ? patients.patients : [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (appointment) {
      reset({
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        datetime: format(new Date(appointment.datetime), "yyyy-MM-dd'T'HH:mm"),
        duration: appointment.duration,
        status: appointment.status,
        notes: appointment.notes,
      });
    } else {
      reset({ duration: 30 });
    }
  }, [appointment, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        datetime: new Date(data.datetime).toISOString(),
      };
      if (isEditing) {
        await appointmentsApi.update(appointment!.id, payload);
        toast({ title: "Appointment updated" });
      } else {
        await appointmentsApi.create(payload);
        toast({ title: "Appointment created" });
      }
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Operation failed";
      toast({ title: msg, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Patient */}
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Controller
              name="patient_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.patient_id && (
              <p className="text-sm text-destructive">{errors.patient_id.message}</p>
            )}
          </div>

          {/* Doctor */}
          <div className="space-y-2">
            <Label>Doctor *</Label>
            <Controller
              name="doctor_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.doctor_id && (
              <p className="text-sm text-destructive">{errors.doctor_id.message}</p>
            )}
          </div>

          {/* Date/Time + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Input type="datetime-local" {...register("datetime")} />
              {errors.datetime && (
                <p className="text-sm text-destructive">{errors.datetime.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" min={5} max={240} step={5} {...register("duration")} />
            </div>
          </div>

          {/* Status (edit only) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={3} placeholder="Optional notes…" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
