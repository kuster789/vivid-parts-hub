import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type Module = "dashboard" | "products" | "orders" | "sales" | "leads" | "users" | "notifications" | "audit_logs";

export interface ModulePermission {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const NO_ACCESS: ModulePermission = { can_view: false, can_create: false, can_edit: false, can_delete: false };

export const usePermissions = () => {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !userRole) {
      setPermissions({});
      setLoading(false);
      return;
    }
    try {
      // Load role baseline
      const { data: rolePerms } = await (supabase as any)
        .from("role_permissions")
        .select("*")
        .eq("role", userRole);

      // Load user overrides
      const { data: overrides } = await (supabase as any)
        .from("user_permission_overrides")
        .select("*")
        .eq("user_id", user.id);

      const map: Record<string, ModulePermission> = {};
      (rolePerms || []).forEach((rp: any) => {
        const ov = (overrides || []).find((o: any) => o.module === rp.module);
        map[rp.module] = {
          can_view: ov?.can_view ?? rp.can_view,
          can_create: ov?.can_create ?? rp.can_create,
          can_edit: ov?.can_edit ?? rp.can_edit,
          can_delete: ov?.can_delete ?? rp.can_delete,
        };
      });
      setPermissions(map);
    } catch (e) {
      console.error("Error loading permissions:", e);
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => { load(); }, [load]);

  const hasPermission = useCallback(
    (module: Module, action: keyof ModulePermission = "can_view") => permissions[module]?.[action] ?? false,
    [permissions]
  );

  const getModulePerms = useCallback(
    (module: Module) => permissions[module] ?? NO_ACCESS,
    [permissions]
  );

  return { permissions, loading, hasPermission, getModulePerms, reload: load };
};
