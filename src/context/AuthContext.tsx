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

  const checkRoles = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    if (data && data.length > 0) {
      const roles = data.map((r: any) => r.role as string);
      const primary = roles[0];
      setUserRole(primary);
      setIsAdmin(roles.some(r => r === "admin_master" || r === "admin"));
      setIsEmployee(roles.some(r => ["supervisor", "operator", "employee"].includes(r)));
      setIsAdminMaster(roles.includes("admin_master"));
      setIsSupervisor(roles.includes("supervisor"));
      setIsOperator(roles.includes("operator"));
    } else {
      resetRoles();
    }
  }, [resetRoles]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkRoles(session.user.id);
      } else {
        resetRoles();
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await checkRoles(session.user.id);
      } else {
        resetRoles();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkRoles, resetRoles]);

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
