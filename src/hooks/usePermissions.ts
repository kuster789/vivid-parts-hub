import { useState, useEffect, useCallback, useRef } from "react";
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
  const userId = user?.id ?? null;

  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({});
  const [loading, setLoading] = useState(true);
  const loadedPrincipalRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const principalKey = userId && userRole ? `${userId}:${userRole}` : null;

    if (!userId || !userRole) {
      setPermissions({});
      loadedPrincipalRef.current = principalKey;
      setLoading(false);
      return;
    }

    const isNewPrincipal = loadedPrincipalRef.current !== principalKey;
    if (isNewPrincipal) {
      setLoading(true);
    }

    try {
      // Load role baseline
      const { data: rolePerms, error: rpError } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role", userRole as any);

      if (rpError) {
        console.error("Error loading role_permissions:", rpError);
      }

      // Load user overrides
      const { data: overrides, error: ovError } = await supabase
        .from("user_permission_overrides")
        .select("*")
        .eq("user_id", userId);

      if (ovError) {
        console.error("Error loading user_permission_overrides:", ovError);
      }

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
      loadedPrincipalRef.current = principalKey;
    } catch (e) {
      console.error("Error loading permissions:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    void load();
  }, [load]);

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
