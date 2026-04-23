"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { MedicalRecord, User } from "@/types";

const schema = z.object({
  doctor_id: z.string().min(1, "Doctor is required"),
  visit_date: z.string().min(1, "Visit date is required"),
  chief_complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescriptions: z.string().optional(),
  follow_up_date: z.string().optional(),
  notes: z.string().optional(),
  // vital signs
  blood_pressure: z.string().optional(),
  temperature: z.string().optional(),
  heart_rate: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygen_saturation: z.string().optional(),
});

export type MedicalRecordFormData = z.infer<typeof schema>;

interface Props {
  doctors: User[];
  defaultValues?: Partial<MedicalRecordFormData>;
  isSubmitting: boolean;
  onSubmit: (data: MedicalRecordFormData) => void;
  onCancel: () => void;
}

function toFormDefaults(record?: MedicalRecord): Partial<MedicalRecordFormData> {
  if (!record) return {};
  return {
    doctor_id: record.doctor_id,
    visit_date: record.visit_date?.slice(0, 10) ?? "",
    chief_complaint: record.chief_complaint ?? "",
    diagnosis: record.diagnosis ?? "",
    treatment: record.treatment ?? "",
    prescriptions: record.prescriptions ?? "",
    follow_up_date: record.follow_up_date?.slice(0, 10) ?? "",
    notes: record.notes ?? "",
    blood_pressure: record.vital_signs?.blood_pressure ?? "",
    temperature: record.vital_signs?.temperature ?? "",
    heart_rate: record.vital_signs?.heart_rate ?? "",
    weight: record.vital_signs?.weight ?? "",
    height: record.vital_signs?.height ?? "",
    oxygen_saturation: record.vital_signs?.oxygen_saturation ?? "",
  };
}

export function MedicalRecordForm({ doctors, defaultValues, isSubmitting, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { visit_date: new Date().toISOString().slice(0, 10) },
  });

  const doctorId = watch("doctor_id");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Doctor + Visit date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Doctor *</Label>
          <Select value={doctorId} onValueChange={(v) => setValue("doctor_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  Dr. {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.doctor_id && (
            <p className="text-xs text-destructive">{errors.doctor_id.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="visit_date">Visit Date *</Label>
          <Input id="visit_date" type="date" {...register("visit_date")} />
          {errors.visit_date && (
            <p className="text-xs text-destructive">{errors.visit_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chief_complaint">Chief Complaint</Label>
        <Input id="chief_complaint" placeholder="e.g. Headache, chest pain…" {...register("chief_complaint")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Textarea id="diagnosis" rows={2} placeholder="Clinical diagnosis…" {...register("diagnosis")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Treatment</Label>
        <Textarea id="treatment" rows={2} placeholder="Treatment plan…" {...register("treatment")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prescriptions">Prescriptions</Label>
        <Textarea id="prescriptions" rows={2} placeholder="Medications prescribed…" {...register("prescriptions")} />
      </div>

      <Separator />

      {/* Vital Signs */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Vital Signs</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="blood_pressure" className="text-xs">Blood Pressure</Label>
            <Input id="blood_pressure" placeholder="120/80 mmHg" {...register("blood_pressure")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temperature" className="text-xs">Temperature</Label>
            <Input id="temperature" placeholder="37.0 °C" {...register("temperature")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="heart_rate" className="text-xs">Heart Rate</Label>
            <Input id="heart_rate" placeholder="72 bpm" {...register("heart_rate")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weight" className="text-xs">Weight</Label>
            <Input id="weight" placeholder="70 kg" {...register("weight")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="height" className="text-xs">Height</Label>
            <Input id="height" placeholder="175 cm" {...register("height")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="oxygen_saturation" className="text-xs">O₂ Saturation</Label>
            <Input id="oxygen_saturation" placeholder="98%" {...register("oxygen_saturation")} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="follow_up_date">Follow-up Date</Label>
          <Input id="follow_up_date" type="date" {...register("follow_up_date")} />
        </div>
        <div className="space-y-2 col-span-full">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Record"}
        </Button>
      </div>
    </form>
  );
}

export { toFormDefaults };
