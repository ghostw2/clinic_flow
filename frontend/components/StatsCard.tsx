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
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-900"   },
  green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600",  text: "text-green-900"  },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", text: "text-purple-900" },
  amber:  { bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-600",  text: "text-amber-900"  },
};

export function StatsCard({ title, value, icon, color, description }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("rounded-xl p-5 border", c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", c.text)}>{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", c.icon)}>{icon}</div>
      </div>
    </div>
  );
}
