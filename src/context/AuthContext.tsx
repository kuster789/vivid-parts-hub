import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isAdminMaster: boolean;
  isSupervisor: boolean;
  isOperator: boolean;
  userRole: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PRIORITY = ["admin_master", "admin", "supervisor", "operator", "employee"] as const;

const AUTH_DIAGNOSTICS =
  typeof window !== "undefined" &&
  (import.meta.env.DEV || new URLSearchParams(window.location.search).get("authDebug") === "1");

const logAuth = (message: string, payload?: unknown) => {
  if (!AUTH_DIAGNOSTICS) return;
  if (payload !== undefined) {
    console.info(`[AuthContext] ${message}`, payload);
    return;
  }
  console.info(`[AuthContext] ${message}`);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isAdminMaster, setIsAdminMaster] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const roleResolutionVersionRef = useRef(0);

  const resetRoles = useCallback(() => {
    setIsAdmin(false);
    setIsEmployee(false);
    setIsAdminMaster(false);
    setIsSupervisor(false);
    setIsOperator(false);
    setUserRole(null);
  }, []);

  const applyRoles = useCallback((roles: string[]) => {
    const primary = ROLE_PRIORITY.find((role) => roles.includes(role)) ?? roles[0] ?? null;

    setUserRole(primary);
    setIsAdmin(roles.some((r) => r === "admin_master" || r === "admin"));
    setIsEmployee(roles.some((r) => ["supervisor", "operator", "employee"].includes(r)));
    setIsAdminMaster(roles.includes("admin_master"));
    setIsSupervisor(roles.includes("supervisor"));
    setIsOperator(roles.includes("operator"));

    logAuth("Roles applied", { roles, primary });
  }, []);

  const resolveRolesWithRetry = useCallback(async (userId: string) => {
    const maxAttempts = 3;
    logAuth("Resolving roles", { userId, maxAttempts });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        const roles = data.map((r: any) => r.role as string);
        logAuth("Roles query success", { attempt, count: data.length });
        applyRoles(roles);
        return;
      }

      logAuth("Roles query failed/empty", {
        attempt,
        error: error?.message ?? null,
        count: data?.length ?? 0,
      });

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      }
    }

    // One final guarded attempt after token/user refresh (helps diagnose delayed auth hydration)
    const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();
    logAuth("Post-retry getUser", {
      error: currentUserError?.message ?? null,
      userId: currentUserData.user?.id ?? null,
    });

    if (currentUserData.user?.id === userId) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        const roles = data.map((r: any) => r.role as string);
        logAuth("Roles resolved on final guarded attempt", { count: data.length });
        applyRoles(roles);
        return;
      }

      logAuth("Final guarded role query failed", {
        error: error?.message ?? null,
        count: data?.length ?? 0,
      });
    }

    logAuth("Role resolution exhausted, resetting roles", { userId });
    resetRoles();
  }, [applyRoles, resetRoles]);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null, source: string) => {
      if (!mounted) return;

      logAuth("Applying session", {
        source,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id ?? null,
      });

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        roleResolutionVersionRef.current += 1;
        resetRoles();
        setLoading(false);
        return;
      }

      setLoading(true);

      const currentResolutionVersion = ++roleResolutionVersionRef.current;

      // Fire-and-forget to avoid deadlocks during auth callbacks
      setTimeout(() => {
        if (!mounted || currentResolutionVersion !== roleResolutionVersionRef.current) return;

        void resolveRolesWithRetry(nextSession.user.id).finally(() => {
          if (mounted && currentResolutionVersion === roleResolutionVersionRef.current) {
            setLoading(false);
          }
        });
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      logAuth("Auth state change", { event, userId: nextSession?.user?.id ?? null });
      applySession(nextSession, `auth_event:${event}`);
    });

    // Bootstrap initial auth state from persisted session
    void supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        logAuth("Initial session loaded", { userId: initialSession?.user?.id ?? null });
        applySession(initialSession, "bootstrap:getSession");
      })
      .catch((error) => {
        logAuth("Initial session load failed", { error: error?.message ?? "unknown" });
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resetRoles, resolveRolesWithRetry]);

  useEffect(() => {
    if (!AUTH_DIAGNOSTICS || typeof window === "undefined") return;

    (window as any).__authDiagnostics = {
      loading,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      userRole,
      isAdmin,
      isEmployee,
      isAdminMaster,
      isSupervisor,
      isOperator,
      timestamp: new Date().toISOString(),
    };

    logAuth("State snapshot", {
      loading,
      userId: user?.id ?? null,
      userRole,
      isAdmin,
      isEmployee,
      isAdminMaster,
      isSupervisor,
      isOperator,
    });
  }, [loading, user, userRole, isAdmin, isEmployee, isAdminMaster, isSupervisor, isOperator]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    logAuth("signUp result", { email, error: error?.message ?? null });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    logAuth("signIn started", { email });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    logAuth("signIn result", { email, error: error?.message ?? null });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    logAuth("signOut started");
    const { error } = await supabase.auth.signOut();
    logAuth("signOut result", { error: error?.message ?? null });
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      isAdmin, isEmployee,
      isAdminMaster, isSupervisor, isOperator,
      userRole,
      signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
