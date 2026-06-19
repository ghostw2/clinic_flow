import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: "blue" | "green" | "purple" | "amber";
  description?: string;
}

const colorMap = {
  blue:   { icon: "bg-blue-100 text-blue-600"    },
  green:  { icon: "bg-green-100 text-green-600"   },
  purple: { icon: "bg-purple-100 text-purple-600" },
  amber:  { icon: "bg-amber-100 text-amber-600"   },
};

export function StatsCard({ title, value, icon, color, description }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className="rounded-md p-5 border border-border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-1 text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn("rounded-md p-2.5", c.icon)}>{icon}</div>
      </div>
    </div>
  );
}
