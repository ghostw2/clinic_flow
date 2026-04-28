"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import { patientsApi } from "@/lib/api";
import { PatientCard } from "@/components/PatientCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search } from "lucide-react";
const PAGE_SIZE = 20;
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PaginatedPatients } from "@/types";

const schema = z.object({
  // Basic
  name: z.string().min(1, "Name is required"),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
  // Medical profile
  gender: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  address: z.string().optional(),
  insurance: z.string().optional(),
  occupation: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const { toast } = useToast();

  const { data, mutate, isLoading } = useSWR<PaginatedPatients>(
    ["patients", search, page],
    () => patientsApi.list({ search, page }).then((r) => r.data)
  );

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    try {
      await patientsApi.create({ ...values, name: values.name });
      toast({ title: "Patient created successfully" });
      mutate();
      setFormOpen(false);
      reset();
    } catch {
      toast({ title: "Failed to create patient", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.total ?? 0} patients registered
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone…"
          className="pl-9"
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.patients?.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <PatientCard patient={patient} />
            </Link>
          ))}
          {data?.patients?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No patients found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create Patient Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) reset(); }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
                <TabsTrigger value="medical" className="flex-1">Medical Profile</TabsTrigger>
                <TabsTrigger value="emergency" className="flex-1">Emergency</TabsTrigger>
              </TabsList>

              {/* Basic Info */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" {...register("dob")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" {...register("occupation")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" rows={2} {...register("address")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={2} {...register("notes")} />
                </div>
              </TabsContent>

              {/* Medical Profile */}
              <TabsContent value="medical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Controller
                      control={control}
                      name="blood_type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOOD_TYPES.map((bt) => (
                              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance">Insurance</Label>
                    <Input id="insurance" placeholder="Provider / policy number" {...register("insurance")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    rows={3}
                    placeholder="e.g. Penicillin, peanuts, latex…"
                    {...register("allergies")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
                  <Textarea
                    id="chronic_conditions"
                    rows={3}
                    placeholder="e.g. Diabetes Type 2, hypertension…"
                    {...register("chronic_conditions")}
                  />
                </div>
              </TabsContent>

              {/* Emergency Contact */}
              <TabsContent value="emergency" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Person to contact in case of emergency.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Full Name</Label>
                  <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Phone</Label>
                  <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} />
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create Patient"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
