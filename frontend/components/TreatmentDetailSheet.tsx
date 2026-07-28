"use client";

import { useState } from "react";
import useSWR from "swr";
import { treatmentsApi } from "@/lib/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Plus, Trash2, Calendar } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Treatment, TreatmentPayment } from "@/types";

function paymentStatusColor(s: string) {
  if (s === "paid") return "bg-green-50 text-green-700 border-green-200";
  if (s === "partial") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function installmentStatusColor(s: string) {
  if (s === "paid") return "bg-green-50 text-green-700 border-green-200";
  if (s === "overdue") return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  treatmentId: string | null;
  onClose: () => void;
  onEdit: (t: Treatment) => void;
  onRefresh: () => void;
}

export function TreatmentDetailSheet({ treatmentId, onClose, onEdit, onRefresh }: Props) {
  const { toast } = useToast();
  const { can } = usePermissions();
  const [addingPayment, setAddingPayment] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: treatment, mutate: refresh } = useSWR<Treatment>(
    treatmentId ? `treatments/${treatmentId}` : null,
    () => treatmentsApi.get(treatmentId!).then((r) => r.data)
  );

  const handleMarkPaid = async (p: TreatmentPayment) => {
    try {
      await treatmentsApi.markPaid(treatmentId!, p.id);
      refresh();
      onRefresh();
      toast({ title: "Payment marked as paid" });
    } catch {
      toast({ title: "Failed to mark payment", variant: "destructive" });
    }
  };

  const handleDeletePayment = async (p: TreatmentPayment) => {
    if (!confirm("Delete this installment?")) return;
    try {
      await treatmentsApi.deletePayment(treatmentId!, p.id);
      refresh();
      onRefresh();
      toast({ title: "Installment deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await treatmentsApi.addPayment(treatmentId!, {
        amount,
        due_date: newDueDate || undefined,
        notes: newNotes || undefined,
      });
      setNewAmount(""); setNewDueDate(""); setNewNotes("");
      setAddingPayment(false);
      refresh();
      onRefresh();
      toast({ title: "Installment added" });
    } catch {
      toast({ title: "Failed to add installment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const pct = treatment
    ? Math.min(100, Math.round((treatment.amount_paid / treatment.total_amount) * 100))
    : 0;

  return (
    <Sheet open={!!treatmentId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {treatment ? (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <SheetTitle className="text-lg">{treatment.name}</SheetTitle>
                  {treatment.patient && (
                    <p className="text-sm text-muted-foreground mt-0.5">{treatment.patient.name}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Badge variant="outline" className={paymentStatusColor(treatment.payment_status)}>
                    {treatment.payment_status === "paid" ? "Fully Paid" :
                     treatment.payment_status === "partial" ? "Partial" : "Pending"}
                  </Badge>
                  <Badge variant="outline" className={
                    treatment.status === "active" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    treatment.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                    "bg-slate-50 text-slate-500 border-slate-200"
                  }>
                    {treatment.status}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold text-slate-800">€{treatment.total_amount.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="font-semibold text-green-700">€{treatment.amount_paid.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold text-orange-700">€{treatment.amount_remaining.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Payment progress</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              <Calendar className="inline h-3.5 w-3.5 mr-1" />
              {treatment.visits_used} of {treatment.planned_visits} planned visits used
            </p>

            {treatment.description && (
              <p className="text-sm text-slate-600 mb-4">{treatment.description}</p>
            )}

            {can("treatment.update") && (
              <Button variant="outline" size="sm" className="mb-4" onClick={() => onEdit(treatment)}>
                Edit Treatment
              </Button>
            )}

            <Separator className="mb-4" />

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">Payment Installments</h3>
              {can("payment.record") && (
                <Button size="sm" variant="outline" onClick={() => setAddingPayment(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              )}
            </div>

            {addingPayment && (
              <div className="border rounded-lg p-3 mb-3 space-y-2 bg-slate-50">
                <input
                  type="number"
                  placeholder="Amount (€)"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
                <input
                  type="date"
                  placeholder="Due date (optional)"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddPayment} disabled={submitting}>
                    {submitting ? "Saving…" : "Save"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingPayment(false); setNewAmount(""); setNewDueDate(""); setNewNotes(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!treatment.payments?.length ? (
              <p className="text-sm text-muted-foreground italic">No installments yet.</p>
            ) : (
              <div className="space-y-2">
                {treatment.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium text-sm">€{p.amount.toFixed(2)}</p>
                      {p.due_date && <p className="text-xs text-muted-foreground">Due {formatDate(p.due_date)}</p>}
                      {p.paid_at && <p className="text-xs text-green-600">Paid {formatDate(p.paid_at)}</p>}
                      {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${installmentStatusColor(p.status)}`}>
                        {p.status}
                      </Badge>
                      {can("payment.record") && p.status !== "paid" && (
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={() => handleMarkPaid(p)}
                          title="Mark as paid"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {can("treatment.update") && p.status !== "paid" && (
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayment(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {treatment.appointments && treatment.appointments.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Linked Visits</h3>
                <div className="space-y-1">
                  {treatment.appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="text-slate-700">
                        {new Date(a.datetime).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Badge variant="outline" className="text-xs">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
