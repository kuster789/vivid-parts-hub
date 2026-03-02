import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Shield, User, MapPin, Phone, Plus, ChevronDown } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  admin_master: "Admin Master",
  supervisor: "Supervisor",
  operator: "Operador",
  admin: "Admin",
  employee: "Funcionário",
};

const ROLE_COLORS: Record<string, string> = {
  admin_master: "border-destructive bg-destructive/10 text-destructive",
  supervisor: "border-primary bg-primary/10 text-primary",
  operator: "border-muted-foreground bg-secondary text-muted-foreground",
};

const MODULES = [
  "dashboard", "products", "orders", "sales", "leads", "users", "notifications", "audit_logs",
];

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Produtos",
  orders: "Pedidos",
  sales: "Vendas",
  leads: "Leads",
  users: "Usuários",
  notifications: "Notificações",
  audit_logs: "Auditoria",
};

const AdminUsers = () => {
  const { user, isAdminMaster, isSupervisor } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Add user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("operator");
  const [creating, setCreating] = useState(false);

  // Permission overrides cache
  const [rolePermsMap, setRolePermsMap] = useState<Record<string, any[]>>({});
  const [userOverrides, setUserOverrides] = useState<Record<string, any[]>>({});

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = (profiles || []).map((p: any) => ({
      ...p,
      role: (roles || []).find((r: any) => r.user_id === p.user_id)?.role || null,
    }));
    setUsers(merged);

    // Load role permissions baseline
    const { data: rp } = await (supabase as any).from("role_permissions").select("*");
    const rpMap: Record<string, any[]> = {};
    (rp || []).forEach((r: any) => {
      if (!rpMap[r.role]) rpMap[r.role] = [];
      rpMap[r.role].push(r);
    });
    setRolePermsMap(rpMap);
    setLoading(false);
  };

  const loadOverrides = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("user_permission_overrides")
      .select("*")
      .eq("user_id", userId);
    setUserOverrides(prev => ({ ...prev, [userId]: data || [] }));
  };

  const getAvailableRoles = () => {
    if (isAdminMaster) return ["admin_master", "supervisor", "operator"];
    if (isSupervisor) return ["operator"];
    return [];
  };

  const createUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newEmail, password: newPassword, full_name: newName, role: newRole },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Usuário criado com sucesso!");
      setShowAdd(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("operator");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (targetUserId: string, currentRole: string, newRoleVal: string) => {
    if (newRoleVal === currentRole) return;
    if (currentRole === "admin_master" && !isAdminMaster) {
      toast.error("Apenas Admin Master pode alterar outro Admin Master");
      return;
    }
    if (isSupervisor && newRoleVal !== "operator") {
      toast.error("Supervisores só podem definir cargo de Operador");
      return;
    }
    try {
      await supabase.from("user_roles").delete().eq("user_id", targetUserId);
      await supabase.from("user_roles").insert({ user_id: targetUserId, role: newRoleVal as any });
      await (supabase as any).from("audit_logs").insert({
        performed_by: user!.id,
        action: "change_role",
        target_user: targetUserId,
        details: { from: currentRole, to: newRoleVal },
      });
      toast.success("Cargo atualizado!");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar cargo");
    }
  };

  const saveOverride = async (targetUserId: string, module: string, field: string, value: boolean) => {
    try {
      const existing = userOverrides[targetUserId]?.find((o: any) => o.module === module);
      if (existing) {
        await (supabase as any)
          .from("user_permission_overrides")
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await (supabase as any)
          .from("user_permission_overrides")
          .insert({ user_id: targetUserId, module, [field]: value });
      }
      await (supabase as any).from("audit_logs").insert({
        performed_by: user!.id,
        action: "update_permissions",
        target_user: targetUserId,
        details: { module, field, value },
      });
      loadOverrides(targetUserId);
      toast.success("Permissão atualizada");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar permissão");
    }
  };

  const toggleExpand = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      if (!userOverrides[userId]) loadOverrides(userId);
    }
  };

  const canEditUser = (targetRole: string | null) => {
    if (isAdminMaster) return true;
    if (isSupervisor && targetRole === "operator") return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {users.length} usuário(s)
        </span>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" /> Adicionar Usuário
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="João Silva"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Senha (mín. 8 caracteres)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cargo</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {getAvailableRoles().map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={createUser}
                disabled={creating}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Criar Usuário"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="overflow-hidden rounded-xl border border-border">
            {/* User row */}
            <div className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.full_name || "Sem nome"}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span>ID: {u.user_id?.slice(0, 8)}</span>
                    {u.phone && (
                      <span className="flex items-center gap-0.5">
                        <Phone className="h-2.5 w-2.5" /> {u.phone}
                      </span>
                    )}
                    {u.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" /> {u.city}, {u.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Role badge */}
                <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  ROLE_COLORS[u.role] || "border-border text-muted-foreground"
                }`}>
                  <Shield className="mr-1 inline h-3 w-3" />
                  {ROLE_LABELS[u.role] || u.role || "Sem cargo"}
                </span>

                {/* Role change dropdown */}
                {canEditUser(u.role) && u.user_id !== user?.id && (
                  <select
                    value={u.role || ""}
                    onChange={e => changeRole(u.user_id, u.role, e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-[10px] text-foreground"
                  >
                    {getAvailableRoles().map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                )}

                {/* Expand permissions (admin_master only) */}
                {isAdminMaster && (
                  <button
                    onClick={() => toggleExpand(u.user_id)}
                    className="rounded-lg border border-border p-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${
                      expandedUser === u.user_id ? "rotate-180" : ""
                    }`} />
                  </button>
                )}
              </div>
            </div>

            {/* Permission overrides panel */}
            {expandedUser === u.user_id && isAdminMaster && (
              <div className="border-t border-border bg-secondary/20 px-4 py-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Permissões (override sobre cargo base: {ROLE_LABELS[u.role] || u.role})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>
                        <th className="pb-1 text-left font-semibold text-muted-foreground">Módulo</th>
                        <th className="pb-1 text-center font-semibold text-muted-foreground">Ver</th>
                        <th className="pb-1 text-center font-semibold text-muted-foreground">Criar</th>
                        <th className="pb-1 text-center font-semibold text-muted-foreground">Editar</th>
                        <th className="pb-1 text-center font-semibold text-muted-foreground">Excluir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(mod => {
                        const baseline = (rolePermsMap[u.role] || []).find((rp: any) => rp.module === mod);
                        const override = (userOverrides[u.user_id] || []).find((o: any) => o.module === mod);
                        return (
                          <tr key={mod} className="border-t border-border/50">
                            <td className="py-1.5 font-medium text-foreground">{MODULE_LABELS[mod] || mod}</td>
                            {(["can_view", "can_create", "can_edit", "can_delete"] as const).map(field => {
                              const baseValue = baseline?.[field] ?? false;
                              const overrideValue = override?.[field];
                              const effective = overrideValue ?? baseValue;
                              const hasOverride = overrideValue !== null && overrideValue !== undefined;
                              return (
                                <td key={field} className="py-1.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={effective}
                                    onChange={e => saveOverride(u.user_id, mod, field, e.target.checked)}
                                    className="h-3.5 w-3.5 rounded border-border accent-primary"
                                  />
                                  {hasOverride && (
                                    <span className="ml-0.5 text-[8px] text-primary">●</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[9px] text-muted-foreground">
                  <span className="text-primary">●</span> = override ativo (diferente do cargo base)
                </p>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum usuário registrado.</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
