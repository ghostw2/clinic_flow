"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { treatmentsApi, patientsApi } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Wand2 } from "lucide-react";
import type { Treatment, Patient } from "@/types";

interface Installment {
  amount: string;
  due_date: string;
  notes: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId?: string;
  treatment?: Treatment;
}

export function TreatmentForm({ open, onClose, onSuccess, patientId, treatment }: Props) {
  const { toast } = useToast();
  const isEdit = !!treatment;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [plannedVisits, setPlannedVisits] = useState("1");
  const [notes, setNotes] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patientId ?? "");
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [splitCount, setSplitCount] = useState("2");
  const [submitting, setSubmitting] = useState(false);

  const { data: patientsData } = useSWR(
    !patientId && open ? "patients-all" : null,
    () => patientsApi.list({ all: true }).then((r) => r.data)
  );

  useEffect(() => {
    if (!open) return;
    if (treatment) {
      setName(treatment.name);
      setDescription(treatment.description ?? "");
      setTotalAmount(treatment.total_amount.toString());
      setPlannedVisits(treatment.planned_visits.toString());
      setNotes(treatment.notes ?? "");
      setSelectedPatientId(treatment.patient_id);
      setInstallments([]);
    } else {
      setName(""); setDescription(""); setTotalAmount(""); setPlannedVisits("1"); setNotes("");
      setSelectedPatientId(patientId ?? "");
      setInstallments([]);
    }
  }, [open, treatment, patientId]);

  const handleSplitEqually = () => {
    const total = parseFloat(totalAmount);
    const n = parseInt(splitCount, 10);
    if (!total || !n || n < 1) {
      toast({ title: "Enter a total amount and split count first", variant: "destructive" });
      return;
    }
    const each = (total / n).toFixed(2);
    setInstallments(Array.from({ length: n }, () => ({ amount: each, due_date: "", notes: "" })));
  };

  const updateInstallment = (i: number, field: keyof Installment, value: string) => {
    setInstallments((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const removeInstallment = (i: number) => {
    setInstallments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast({ title: "Procedure name is required", variant: "destructive" }); return; }
    const total = parseFloat(totalAmount);
    if (!total || total <= 0) { toast({ title: "Enter a valid total amount", variant: "destructive" }); return; }
    if (!selectedPatientId) { toast({ title: "Select a patient", variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      if (isEdit && treatment) {
        await treatmentsApi.update(treatment.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          total_amount: total,
          planned_visits: parseInt(plannedVisits, 10) || 1,
          notes: notes.trim() || undefined,
        });
      } else {
        const created = await treatmentsApi.create({
          patient_id: selectedPatientId,
          name: name.trim(),
          description: description.trim() || undefined,
          total_amount: total,
          planned_visits: parseInt(plannedVisits, 10) || 1,
          notes: notes.trim() || undefined,
        });
        const newId = created.data.id;
        for (const inst of installments) {
          const amt = parseFloat(inst.amount);
          if (amt > 0) {
            await treatmentsApi.addPayment(newId, {
              amount: amt,
              due_date: inst.due_date || undefined,
              notes: inst.notes.trim() || undefined,
            });
          }
        }
      }
      toast({ title: isEdit ? "Treatment updated" : "Treatment created" });
      onSuccess();
      onClose();
    } catch {
      toast({ title: "Failed to save treatment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const patients: Patient[] = patientsData?.patients ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Treatment" : "New Treatment Course"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!patientId && !isEdit && (
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm bg-white"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">Select a patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Procedure Name</Label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g. Orthodontic Treatment, Root Canal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm resize-none"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total Amount (€)</Label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Planned Visits</Label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2 text-sm"
                value={plannedVisits}
                onChange={(e) => setPlannedVisits(e.target.value)}
                min="1"
                max="100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="border rounded-lg p-3 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Payment Installments</p>
                <Button
                  type="button" size="sm" variant="ghost"
                  onClick={() => setInstallments((prev) => [...prev, { amount: "", due_date: "", notes: "" }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-20 border rounded px-2 py-1 text-sm bg-white"
                  value={splitCount}
                  onChange={(e) => setSplitCount(e.target.value)}
                  min="1" max="100"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleSplitEqually}>
                  <Wand2 className="h-3.5 w-3.5 mr-1" /> Split equally
                </Button>
                {installments.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {installments.length} installment{installments.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {installments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No installments — patient pays the full amount at once, or add installments above.
                </p>
              )}

              {installments.map((inst, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number" placeholder="€"
                    className="w-24 border rounded px-2 py-1 text-sm bg-white flex-shrink-0"
                    value={inst.amount}
                    onChange={(e) => updateInstallment(i, "amount", e.target.value)}
                    min="0.01" step="0.01"
                  />
                  <input
                    type="date"
                    className="flex-1 border rounded px-2 py-1 text-sm bg-white"
                    value={inst.due_date}
                    onChange={(e) => updateInstallment(i, "due_date", e.target.value)}
                  />
                  <Button
                    type="button" size="icon" variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => removeInstallment(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Treatment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
