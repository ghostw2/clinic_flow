"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import { patientsApi } from "@/lib/api";
import { downloadCSV, downloadExcel } from "@/lib/export";
import { PatientCard } from "@/components/PatientCard";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useI18n } from "@/contexts/i18nContext";
import { Plus, Search, Download, FileSpreadsheet, FileText, X, LayoutGrid, Rows } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
const PAGE_SIZE = 20;
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PaginatedPatients } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
  gender: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  address: z.string().optional(),
  insurance: z.string().optional(),
  occupation: z.string().optional(),
  consent_given_at: z.string().optional(),
  consent_notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<"grid" | "table">(() =>
    typeof window !== "undefined" ? (localStorage.getItem("patients_view") as "grid" | "table") ?? "grid" : "grid"
  );
  const [sortBy, setSortBy] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("patients_sort") ?? "newest" : "newest"
  );
  const { toast } = useToast();
  const { t } = useI18n();
  const { can } = usePermissions();

  const setViewPersisted = (v: "grid" | "table") => {
    setView(v);
    localStorage.setItem("patients_view", v);
  };
  const setSortPersisted = (v: string) => {
    setSortBy(v);
    localStorage.setItem("patients_sort", v);
  };

  const { data, mutate, isLoading } = useSWR<PaginatedPatients>(
    ["patients", search, createdFrom, createdTo, page],
    () => patientsApi.list({ search, created_from: createdFrom, created_to: createdTo, page }).then((r) => r.data)
  );

  const hasFilters = search || createdFrom || createdTo;

  const clearFilters = () => {
    setSearch("");
    setCreatedFrom("");
    setCreatedTo("");
    setPage(1);
  };

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(true);
    try {
      const res = await patientsApi.list({
        search,
        created_from: createdFrom,
        created_to: createdTo,
        all: true,
      });
      const patients = res.data.patients ?? [];
      const headers = ["Name", "DOB", "Gender", "Phone", "Email", "Address", "Occupation", "Blood Type", "Allergies", "Chronic Conditions", "Insurance", "Emergency Contact", "Emergency Phone", "Notes", "Registered"];
      const rows = patients.map((p) => [
        p.name,
        p.dob ? p.dob.slice(0, 10) : "",
        p.gender ?? "",
        p.phone ?? "",
        p.email ?? "",
        p.address ?? "",
        p.occupation ?? "",
        p.blood_type ?? "",
        p.allergies ?? "",
        p.chronic_conditions ?? "",
        p.insurance ?? "",
        p.emergency_contact_name ?? "",
        p.emergency_contact_phone ?? "",
        p.notes ?? "",
        p.created_at.slice(0, 10),
      ]);
      const filename = `patients_${new Date().toISOString().slice(0, 10)}`;
      if (format === "csv") downloadCSV(filename, headers, rows);
      else downloadExcel(filename, headers, rows);
    } catch {
      toast({ title: t("patients.toast.exportFailed"), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

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
      toast({ title: t("patients.toast.created") });
      mutate();
      setFormOpen(false);
      reset();
    } catch {
      toast({ title: t("patients.toast.createFailed"), variant: "destructive" });
    }
  };

  const GENDERS = [
    { value: "Male", label: t("patients.genders.male") },
    { value: "Female", label: t("patients.genders.female") },
    { value: "Other", label: t("patients.genders.other") },
    { value: "Prefer not to say", label: t("patients.genders.preferNotToSay") },
  ];

  const sortedPatients = [...(data?.patients ?? [])].sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("patients.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("patients.registered", { count: data?.total ?? 0 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-slate-200 overflow-hidden">
            <button
              title="Grid view"
              onClick={() => setViewPersisted("grid")}
              className={`px-2 py-1.5 ${view === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              title="Table view"
              onClick={() => setViewPersisted("table")}
              className={`px-2 py-1.5 border-l border-slate-200 ${view === "table" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              <Rows className="h-4 w-4" />
            </button>
          </div>
          {can("patient.create") && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> {t("patients.newPatient")}
            </Button>
          )}
        </div>
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("patients.searchPlaceholder")}
            className="pl-9 w-full sm:w-56"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <Input
          type="date"
          className="w-full sm:w-40"
          value={createdFrom}
          onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }}
          title={t("patients.registeredFrom")}
        />
        <Input
          type="date"
          className="w-full sm:w-40"
          value={createdTo}
          onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }}
          title={t("patients.registeredTo")}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" /> {t("common.clear")}
          </Button>
        )}
        <Select value={sortBy} onValueChange={setSortPersisted}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name_asc">Name A → Z</SelectItem>
            <SelectItem value="name_desc">Name Z → A</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={exporting}>
              <Download className="h-4 w-4 mr-1.5" />
              {exporting ? t("common.exporting") : t("common.export")}
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

      {/* Patient List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPatients.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <PatientCard patient={patient} />
            </Link>
          ))}
          {sortedPatients.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("patients.noPatients")}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t("patients.noPatients")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => window.location.href = `/patients/${patient.id}`}
                  >
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.dob ? formatDate(patient.dob) : "—"}</TableCell>
                    <TableCell>{patient.gender ?? "—"}</TableCell>
                    <TableCell>{patient.phone ?? "—"}</TableCell>
                    <TableCell>{patient.blood_type ?? "—"}</TableCell>
                    <TableCell>{formatDate(patient.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
            {t("common.page")} {page} {t("common.of")} {totalPages}
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
            <DialogTitle>{t("patients.form.title")}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="basic" className="flex-1">{t("patients.form.basicInfo")}</TabsTrigger>
                <TabsTrigger value="medical" className="flex-1">{t("patients.form.medicalProfile")}</TabsTrigger>
                <TabsTrigger value="emergency" className="flex-1">{t("patients.form.emergency")}</TabsTrigger>
                <TabsTrigger value="consent" className="flex-1">Consent</TabsTrigger>
              </TabsList>

              {/* Basic Info */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("patients.form.fullNameRequired")}</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">{t("patients.form.dateOfBirth")}</Label>
                    <Input id="dob" type="date" {...register("dob")} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("patients.form.gender")}</Label>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("patients.form.selectGender")} />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((g) => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("patients.form.phone")}</Label>
                    <Input id="phone" {...register("phone")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("patients.form.email")}</Label>
                    <Input id="email" type="email" {...register("email")} />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">{t("patients.form.occupation")}</Label>
                  <Input id="occupation" {...register("occupation")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("patients.form.address")}</Label>
                  <Textarea id="address" rows={2} {...register("address")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t("patients.form.notes")}</Label>
                  <Textarea id="notes" rows={2} {...register("notes")} />
                </div>
              </TabsContent>

              {/* Medical Profile */}
              <TabsContent value="medical" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("patients.form.bloodType")}</Label>
                    <Controller
                      control={control}
                      name="blood_type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("patients.form.selectBloodType")} />
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
                    <Label htmlFor="insurance">{t("patients.form.insurance")}</Label>
                    <Input id="insurance" placeholder={t("patients.form.insurancePlaceholder")} {...register("insurance")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">{t("patients.form.allergies")}</Label>
                  <Textarea
                    id="allergies"
                    rows={3}
                    placeholder={t("patients.form.allergiesPlaceholder")}
                    {...register("allergies")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chronic_conditions">{t("patients.form.chronicConditions")}</Label>
                  <Textarea
                    id="chronic_conditions"
                    rows={3}
                    placeholder={t("patients.form.chronicConditionsPlaceholder")}
                    {...register("chronic_conditions")}
                  />
                </div>
              </TabsContent>

              {/* Emergency Contact */}
              <TabsContent value="emergency" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">{t("patients.form.emergencyHelp")}</p>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">{t("patients.form.emergencyContactName")}</Label>
                  <Input id="emergency_contact_name" {...register("emergency_contact_name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">{t("patients.form.emergencyContactPhone")}</Label>
                  <Input id="emergency_contact_phone" {...register("emergency_contact_phone")} />
                </div>
              </TabsContent>

              {/* GDPR Consent */}
              <TabsContent value="consent" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Record when and how the patient gave consent to store their personal health data (GDPR Art. 7).
                </p>
                <div className="space-y-2">
                  <Label htmlFor="consent_given_at">Consent given on</Label>
                  <Input id="consent_given_at" type="date" {...register("consent_given_at")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consent_notes">Consent notes</Label>
                  <Textarea
                    id="consent_notes"
                    rows={3}
                    placeholder="e.g. Verbal consent, signed paper form #42, etc."
                    {...register("consent_notes")}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); reset(); }}>
                {t("patients.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("patients.form.creating") : t("patients.form.create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
