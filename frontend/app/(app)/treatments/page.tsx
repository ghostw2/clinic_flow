"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { treatmentsApi } from "@/lib/api";
import { TreatmentForm } from "@/components/TreatmentForm";
import { TreatmentDetailSheet } from "@/components/TreatmentDetailSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Plus, ClipboardList } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Treatment } from "@/types";

function paymentStatusColor(s: string) {
  if (s === "paid") return "bg-green-50 text-green-700 border-green-200";
  if (s === "partial") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function treatmentStatusColor(s: string) {
  if (s === "active") return "bg-blue-50 text-blue-700 border-blue-200";
  if (s === "completed") return "bg-green-50 text-green-700 border-green-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

export default function TreatmentsPage() {
  const { can } = usePermissions();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const { data, mutate, isLoading } = useSWR<{ treatments: Treatment[]; total: number }>(
    "treatments",
    () => treatmentsApi.list().then((r) => r.data)
  );

  const treatments = data?.treatments ?? [];

  const filtered = useMemo(() => {
    return treatments.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (paymentFilter && t.payment_status !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const patientMatch = t.patient?.name?.toLowerCase().includes(q);
        const nameMatch = t.name.toLowerCase().includes(q);
        if (!patientMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [treatments, statusFilter, paymentFilter, search]);

  const handleEdit = (t: Treatment) => {
    setSelectedId(null);
    setEditingTreatment(t);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTreatment(undefined);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Treatments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage procedure courses and payment plans
          </p>
        </div>
        {can("treatment.create") && (
          <Button onClick={() => { setEditingTreatment(undefined); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Treatment
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search patient or procedure…"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter || "all"} onValueChange={(v) => setPaymentFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Fully Paid</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter || paymentFilter) && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(""); setStatusFilter(""); setPaymentFilter(""); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No treatments found"
          description={
            search || statusFilter || paymentFilter
              ? "Try adjusting your filters."
              : "Create the first treatment course for a patient."
          }
          action={
            can("treatment.create")
              ? { label: "New Treatment", onClick: () => setFormOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-center">Visits</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelectedId(t.id)}
                >
                  <TableCell className="font-medium">{t.patient?.name ?? "—"}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell className="text-right">€{t.total_amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-green-700">€{t.amount_paid.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-orange-700">€{t.amount_remaining.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{t.visits_used}/{t.planned_visits}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${paymentStatusColor(t.payment_status)}`}>
                      {t.payment_status === "paid" ? "Fully Paid" :
                       t.payment_status === "partial" ? "Partial" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${treatmentStatusColor(t.status)}`}>
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TreatmentForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={() => mutate()}
        treatment={editingTreatment}
      />

      <TreatmentDetailSheet
        treatmentId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={handleEdit}
        onRefresh={() => mutate()}
      />
    </div>
  );
}
