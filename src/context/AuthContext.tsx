import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  const resetRoles = useCallback(() => {
    setIsAdmin(false);
    setIsEmployee(false);
    setIsAdminMaster(false);
    setIsSupervisor(false);
    setIsOperator(false);
    setUserRole(null);
  }, []);

  const resolveRolesWithRetry = useCallback(async (userId: string) => {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        const roles = data.map((r: any) => r.role as string);
        const primary = ROLE_PRIORITY.find((role) => roles.includes(role)) ?? roles[0] ?? null;

        setUserRole(primary);
        setIsAdmin(roles.some((r) => r === "admin_master" || r === "admin"));
        setIsEmployee(roles.some((r) => ["supervisor", "operator", "employee"].includes(r)));
        setIsAdminMaster(roles.includes("admin_master"));
        setIsSupervisor(roles.includes("supervisor"));
        setIsOperator(roles.includes("operator"));
        return;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      }
    }

    resetRoles();
  }, [resetRoles]);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        resetRoles();
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fire-and-forget to avoid deadlocks during auth callbacks
      setTimeout(() => {
        if (!mounted) return;
        void resolveRolesWithRetry(nextSession.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    // Bootstrap initial auth state from persisted session
    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resetRoles, resolveRolesWithRetry]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
