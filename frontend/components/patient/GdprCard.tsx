"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Download, ShieldCheck, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types";

interface GdprCardProps {
  patient: Patient;
  onExport: () => void;
  onPurgeClick: () => void;
}

export function GdprCard({ patient, onExport, onPurgeClick }: GdprCardProps) {
  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" /> GDPR / Data Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {patient.consent_given_at ? (
            <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Consent recorded {formatDate(patient.consent_given_at)}
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline">
              No consent on file
            </Badge>
          )}
          {patient.consent_notes && (
            <span className="text-xs text-muted-foreground">{patient.consent_notes}</span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export Data
          </Button>
          <Button variant="destructive" size="sm" onClick={onPurgeClick}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Permanently Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
