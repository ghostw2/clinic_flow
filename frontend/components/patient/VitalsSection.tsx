"use client";

import { Separator } from "@/components/ui/separator";
import type { VitalSigns } from "@/types";

function VitalBadge({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

interface VitalsSectionProps {
  vitalSigns: VitalSigns;
  t: (key: string) => string;
}

export function VitalsSection({ vitalSigns, t }: VitalsSectionProps) {
  if (!Object.values(vitalSigns).some(Boolean)) return null;
  return (
    <>
      <Separator />
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {t("patients.detail.vitalSigns")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <VitalBadge label={t("records.bloodPressure")} value={vitalSigns.blood_pressure} />
          <VitalBadge label={t("records.temperature")} value={vitalSigns.temperature} />
          <VitalBadge label={t("records.heartRate")} value={vitalSigns.heart_rate} />
          <VitalBadge label={t("records.weight")} value={vitalSigns.weight} />
          <VitalBadge label={t("records.height")} value={vitalSigns.height} />
          <VitalBadge label={t("patients.detail.oxygenSatShort")} value={vitalSigns.oxygen_saturation} />
        </div>
      </div>
    </>
  );
}
