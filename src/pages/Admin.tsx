import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Package, Users, ShoppingBag, Plus, Pencil, Trash2, Save, X, BarChart3 } from "lucide-react";

type Tab = "dashboard" | "products" | "orders" | "users";

const Admin = () => {
  const { user, isAdmin, isEmployee, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return <div className="flex min-h-[80vh] items-center justify-center"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!user || (!isAdmin && !isEmployee)) return <Navigate to="/login" replace />;

  return (
    <main className="py-8">
      <div className="container">
        <h1 className="section-title mb-6">Painel Administrativo</h1>

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "products", label: "Produtos", icon: Package },
            { id: "orders", label: "Pedidos", icon: ShoppingBag },
            ...(isAdmin ? [{ id: "users" as Tab, label: "Usuários", icon: Users }] : []),
          ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium transition-all ${
                tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <AdminDashboard />}
        {tab === "products" && <AdminProducts />}
        {tab === "orders" && <AdminOrders />}
        {tab === "users" && isAdmin && <AdminUsers />}
      </div>
    </main>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: prodCount } = await supabase.from("products").select("*", { count: "exact", head: true });
      const { data: orders } = await supabase.from("orders").select("total");
      setStats({
        products: prodCount || 0,
        orders: orders?.length || 0,
        revenue: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Produtos", value: stats.products, icon: Package },
        { label: "Pedidos", value: stats.orders, icon: ShoppingBag },
        { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: BarChart3 },
      ].map(({ label, value, icon: Icon }) => (
        <div key={label} className="card-industrial flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "" });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const handleSave = async (id: string) => {
    await supabase.from("products").update(editForm).eq("id", id);
    setEditing(null);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const handleAdd = async () => {
    await supabase.from("products").insert({ ...newProduct, active: true });
    setShowAdd(false);
    setNewProduct({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "" });
    loadProducts();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{products.length} produto(s)</span>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary-glow flex items-center gap-2 rounded-md px-4 py-2 text-xs">
          <Plus className="h-4 w-4" /> Novo Produto
        </button>
      </div>

      {showAdd && (
        <div className="card-industrial mb-4 p-4">
          <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Novo Produto</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {["name", "sku", "brand", "model"].map((f) => (
              <input key={f} placeholder={f} value={(newProduct as any)[f]} onChange={(e) => setNewProduct({ ...newProduct, [f]: e.target.value })}
                className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            ))}
            <input type="number" placeholder="Preço" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            <input type="number" placeholder="Estoque" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>
          <textarea placeholder="Descrição" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="mt-3 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" rows={2} />
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="btn-primary-glow rounded-md px-4 py-2 text-xs">Salvar</button>
            <button onClick={() => setShowAdd(false)} className="rounded-md border border-border px-4 py-2 text-xs text-muted-foreground">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <div key={p.id} className="card-industrial flex items-center gap-4 p-4">
            {editing === p.id ? (
              <div className="flex flex-1 flex-wrap gap-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  className="w-24 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                  className="w-20 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                <button onClick={() => handleSave(p.id)} className="rounded-md bg-primary p-2 text-primary-foreground"><Save className="h-4 w-4" /></button>
                <button onClick={() => setEditing(null)} className="rounded-md border border-border p-2 text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.brand?.toUpperCase()} · {p.model} · SKU: {p.sku}</p>
                </div>
                <span className="text-xs text-muted-foreground">Estoque: {p.stock}</span>
                <span className="font-display text-sm font-bold text-primary">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                <button onClick={() => { setEditing(p.id); setEditForm({ name: p.name, price: p.price, stock: p.stock }); }}
                  className="rounded-md p-2 text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(p.id)} className="rounded-md p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders(data || []);
    };
    load();
  }, []);

  const statusColors: Record<string, string> = {
    pending: "text-primary",
    confirmed: "text-foreground",
    shipped: "text-success",
    delivered: "text-success",
    cancelled: "text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const updateStatus = async (id: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  return (
    <div className="flex flex-col gap-2">
      {orders.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhum pedido registrado.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card-industrial p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Pedido #{o.id.slice(0, 8)}</p>
              <p className="text-sm font-semibold text-foreground">{o.shipping_name}</p>
              <p className="text-xs text-muted-foreground">{o.shipping_city}, {o.shipping_state}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-bold text-primary">R$ {Number(o.total).toFixed(2).replace(".", ",")}</p>
              <p className={`text-xs font-medium ${statusColors[o.status] || ""}`}>{statusLabels[o.status] || o.status}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
              <button key={s} onClick={() => updateStatus(o.id, s)}
                className={`rounded-sm border px-3 py-1 text-[10px] uppercase tracking-wider transition-all ${
                  o.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      const merged = (profiles || []).map((p: any) => ({
        ...p,
        roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
      }));
      setUsers(merged);
    };
    load();
  }, []);

  const toggleRole = async (userId: string, role: "admin" | "employee", hasRole: boolean) => {
    if (hasRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert([{ user_id: userId, role }]);
    }
    // Reload
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    setUsers((profiles || []).map((p: any) => ({
      ...p,
      roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
    })));
  };

  return (
    <div className="flex flex-col gap-2">
      {users.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhum usuário registrado.</p>}
      {users.map((u) => (
        <div key={u.id} className="card-industrial flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{u.full_name || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground">{u.user_id?.slice(0, 8)}...</p>
          </div>
          <div className="flex gap-2">
            {(["admin", "employee"] as const).map((role) => (
              <button key={role} onClick={() => toggleRole(u.user_id, role, u.roles?.includes(role))}
                className={`rounded-sm border px-3 py-1 text-[10px] uppercase tracking-wider transition-all ${
                  u.roles?.includes(role) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;
