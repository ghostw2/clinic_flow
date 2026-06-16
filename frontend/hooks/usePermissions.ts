"use client";

import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { permissionsApi } from "@/lib/api";
import type { ClinicPermissions, PermissionAction } from "@/types";

export function usePermissions() {
  const { user } = useAuth();

  const { data: perms, mutate } = useSWR<ClinicPermissions>(
    user ? "settings/permissions" : null,
    () => permissionsApi.get().then((r) => r.data),
    { revalidateOnFocus: false }
  );

  const can = (action: PermissionAction): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return (perms?.[user.role] ?? []).includes(action);
  };

  return { can, perms, mutate };
}
