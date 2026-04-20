import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail, Calendar } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import type { Patient } from "@/types";

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(patient.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{patient.name}</p>
            {patient.dob && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {formatDate(patient.dob)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {patient.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              {patient.phone}
            </p>
          )}
          {patient.email && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              <span className="truncate">{patient.email}</span>
            </p>
          )}
        </div>
        {patient.notes && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-slate-50 rounded p-2">
            {patient.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
