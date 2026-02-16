import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, User, MapPin, Phone } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = (profiles || []).map((p: any) => ({
      ...p,
      roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
    }));
    setUsers(merged);
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: "admin" | "employee", hasRole: boolean) => {
    if (hasRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert([{ user_id: userId, role }]);
    }
    loadUsers();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{users.length} usuário(s)</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usuário</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">Contato</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">Localização</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissões</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u.full_name || "Sem nome"}</p>
                      <p className="text-[10px] text-muted-foreground">ID: {u.user_id?.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {u.phone ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {u.phone}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  {u.city ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {u.city}, {u.state}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {(["admin", "employee"] as const).map((role) => (
                      <button key={role} onClick={() => toggleRole(u.user_id, role, u.roles?.includes(role))}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          u.roles?.includes(role)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                        }`}>
                        <Shield className="h-3 w-3" />
                        {role}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum usuário registrado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
