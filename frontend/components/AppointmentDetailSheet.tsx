"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { appointmentsApi, documentsApi } from "@/lib/api";
import { statusColor } from "@/lib/utils";
import type { Appointment, AppointmentDocument, DocumentType } from "@/types";
import {
  Upload, Trash2, Download, FileText, Image, FlaskConical,
  Stethoscope, ScanLine, Camera, File, X, Loader2,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: "odontogram",  label: "Odontogram" },
  { value: "dicom",       label: "DICOM" },
  { value: "xray",        label: "X-Ray" },
  { value: "lab",         label: "Lab Result" },
  { value: "report",      label: "Report" },
  { value: "photo",       label: "Photo" },
  { value: "other",       label: "Other" },
];

function DocTypeIcon({ type }: { type: DocumentType }) {
  const cls = "h-5 w-5 shrink-0";
  switch (type) {
    case "odontogram": return <Stethoscope className={cls} />;
    case "dicom":      return <ScanLine    className={cls} />;
    case "xray":       return <ScanLine    className={cls} />;
    case "lab":        return <FlaskConical className={cls} />;
    case "report":     return <FileText    className={cls} />;
    case "photo":      return <Camera      className={cls} />;
    default:           return <File        className={cls} />;
  }
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ── Details form ─────────────────────────────────────────────────────────────

const detailsSchema = z.object({
  status:   z.enum(["pending", "confirmed", "completed", "cancelled"]),
  datetime: z.string().min(1),
  duration: z.coerce.number().min(5).max(240),
  notes:    z.string().optional(),
});
type DetailsForm = z.infer<typeof detailsSchema>;

function DetailsTab({ appointment, onSaved }: { appointment: Appointment; onSaved: () => void }) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { isSubmitting, isDirty } } =
    useForm<DetailsForm>({ resolver: zodResolver(detailsSchema) });

  useEffect(() => {
    reset({
      status:   appointment.status,
      datetime: format(new Date(appointment.datetime), "yyyy-MM-dd'T'HH:mm"),
      duration: appointment.duration,
      notes:    appointment.notes ?? "",
    });
  }, [appointment, reset]);

  const onSubmit = async (data: DetailsForm) => {
    try {
      await appointmentsApi.update(appointment.id, {
        ...data,
        datetime: new Date(data.datetime).toISOString(),
      });
      toast({ title: "Appointment updated" });
      onSaved();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
      {/* Status */}
      <div className="space-y-1.5">
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
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColor(s)}>{STATUS_LABELS[s]}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Patient / Doctor (read-only) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Patient</Label>
          <Input value={appointment.patient?.name ?? "—"} readOnly className="bg-slate-50" />
        </div>
        <div className="space-y-1.5">
          <Label>Doctor</Label>
          <Input value={appointment.doctor ? `Dr. ${appointment.doctor.name}` : "—"} readOnly className="bg-slate-50" />
        </div>
      </div>

      {/* Date/Time + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Date & Time</Label>
          <Input type="datetime-local" {...register("datetime")} />
        </div>
        <div className="space-y-1.5">
          <Label>Duration (min)</Label>
          <Input type="number" min={5} max={240} step={5} {...register("duration")} />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea rows={4} placeholder="Clinical notes…" {...register("notes")} />
      </div>

      <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full">
        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Changes"}
      </Button>
    </form>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ appointment }: { appointment: Appointment }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("other");
  const [preview, setPreview] = useState<AppointmentDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], mutate, isLoading } = useSWR<AppointmentDocument[]>(
    `docs-${appointment.id}`,
    () => documentsApi.list(appointment.id).then((r) => r.data)
  );

  const upload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await documentsApi.upload(appointment.id, file, docType);
      }
      toast({ title: `${files.length > 1 ? `${files.length} files` : "File"} uploaded` });
      mutate();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [appointment.id, docType, mutate, toast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    upload(e.dataTransfer.files);
  };

  const handleDelete = async (doc: AppointmentDocument) => {
    if (!confirm(`Delete "${doc.original_name}"?`)) return;
    try {
      await documentsApi.remove(appointment.id, doc.id);
      toast({ title: "Document deleted" });
      mutate();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const isImage = (mime: string) => mime.startsWith("image/");
  const isPDF   = (mime: string) => mime === "application/pdf";

  return (
    <div className="space-y-5 py-2">
      {/* Upload zone */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Document type</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Drop files here or click to browse</p>
              <p className="text-xs">Supports: DICOM (.dcm), images, PDFs, and any document — up to 50 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".dcm,image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      </div>

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors group"
            >
              {/* Icon or thumbnail */}
              <div className="shrink-0 w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                {isImage(doc.mime_type) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={documentsApi.fileUrl(appointment.id, doc.id, true)}
                    alt={doc.original_name}
                    className="w-10 h-10 object-cover rounded-md"
                  />
                ) : (
                  <DocTypeIcon type={doc.doc_type} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.original_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                    {doc.doc_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(doc.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImage(doc.mime_type) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Preview"
                    onClick={() => setPreview(doc)}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                )}
                {isPDF(doc.mime_type) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="View PDF"
                    onClick={() => window.open(documentsApi.fileUrl(appointment.id, doc.id, true), "_blank")}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Download"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = documentsApi.fileUrl(appointment.id, doc.id);
                    a.download = doc.original_name;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Delete"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image preview lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-10 right-0 text-white hover:text-white hover:bg-white/20"
              onClick={() => setPreview(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={documentsApi.fileUrl(appointment.id, preview.id, true)}
              alt={preview.original_name}
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
            />
            <p className="text-center text-white/70 text-sm mt-2">{preview.original_name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentDetailSheet({ appointment, onClose, onSaved }: AppointmentDetailSheetProps) {
  const open = !!appointment;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 gap-0"
      >
        {/* Header */}
        {appointment && (
          <>
            <SheetHeader className="px-6 py-4 border-b shrink-0">
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="min-w-0">
                  <SheetTitle className="text-base truncate">
                    {appointment.patient?.name ?? "Appointment"}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {format(new Date(appointment.datetime), "EEEE, MMMM d, yyyy · h:mm a")}
                    {" · "}{appointment.duration} min
                    {appointment.doctor && ` · Dr. ${appointment.doctor.name}`}
                  </p>
                </div>
                <Badge variant="outline" className={`shrink-0 ${statusColor(appointment.status)}`}>
                  {STATUS_LABELS[appointment.status]}
                </Badge>
              </div>
            </SheetHeader>

            {/* Tabs */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="details" className="h-full">
                <TabsList className="w-full rounded-none border-b h-10 bg-white px-6 justify-start gap-4">
                  <TabsTrigger value="details" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-1">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="text-sm data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-1">
                    Documents
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="px-6 pb-6 mt-0">
                  <DetailsTab appointment={appointment} onSaved={onSaved} />
                </TabsContent>

                <TabsContent value="documents" className="px-6 pb-6 mt-0">
                  <DocumentsTab appointment={appointment} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
