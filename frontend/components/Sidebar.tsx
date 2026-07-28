"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18nContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",    key: "nav.dashboard",    icon: LayoutDashboard },
  { href: "/appointments", key: "nav.appointments", icon: Calendar },
  { href: "/patients",     key: "nav.patients",     icon: Users },
  { href: "/treatments",   key: "nav.treatments",   icon: ClipboardList },
  { href: "/settings",     key: "nav.settings",     icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 flex-shrink-0">
        <div className="bg-primary text-primary-foreground rounded-lg p-2">
          <Stethoscope className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg text-slate-900">ClinicFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-r-md text-sm font-medium transition-colors",
                active
                  ? "pl-2 pr-3 border-l-2 border-primary bg-primary/5 text-primary"
                  : "px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0">
        <p className="text-xs text-muted-foreground">ClinicFlow v1.0</p>
      </div>
    </>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-slate-200 flex-col">
        <NavContent />
      </aside>

      {/* Mobile sidebar — Sheet drawer */}
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="left" className="p-0 w-60 flex flex-col">
          <NavContent onNavClick={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
