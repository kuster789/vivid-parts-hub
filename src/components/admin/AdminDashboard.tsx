import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingBag, DollarSign, Calendar, Truck, TrendingUp, Users, Loader2, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import AdminCharts from "@/components/AdminCharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, cancelled: 0, customers: 0,
    recentOrders: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [
        { count: prodCount },
        { data: orders },
        { count: customerCount },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, status, created_at, shipping_name, id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const o = orders || [];
      setStats({
        products: prodCount || 0,
        orders: o.length,
        revenue: o.reduce((s, x) => s + Number(x.total), 0),
        pending: o.filter((x) => x.status === "pending").length,
        shipped: o.filter((x) => x.status === "shipped").length,
        delivered: o.filter((x) => x.status === "delivered").length,
        cancelled: o.filter((x) => x.status === "cancelled").length,
        customers: customerCount || 0,
        recentOrders: o.slice(0, 5),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mainCards = [
    { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, trend: "+12%", up: true },
    { label: "Pedidos", value: stats.orders, icon: ShoppingBag, trend: `${stats.pending} pendentes`, up: null },
    { label: "Produtos", value: stats.products, icon: Package, trend: "Ativos no catálogo", up: null },
    { label: "Clientes", value: stats.customers, icon: Users, trend: "Registrados", up: null },
  ];

  const statusCards = [
    { label: "Pendentes", value: stats.pending, color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Calendar },
    { label: "Enviados", value: stats.shipped, color: "text-blue-400", bg: "bg-blue-400/10", icon: Truck },
    { label: "Entregues", value: stats.delivered, color: "text-green-500", bg: "bg-green-500/10", icon: TrendingUp },
    { label: "Cancelados", value: stats.cancelled, color: "text-destructive", bg: "bg-destructive/10", icon: Package },
  ];

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500",
    confirmed: "bg-blue-400/10 text-blue-400",
    shipped: "bg-purple-400/10 text-purple-400",
    delivered: "bg-green-500/10 text-green-500",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Main stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainCards.map(({ label, value, icon: Icon, trend, up }) => (
          <div key={label} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-2xl font-black text-foreground">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              {up !== null && (
                up ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className={up !== null ? (up ? "text-green-500" : "text-destructive") : "text-muted-foreground"}>{trend}</span>
            </div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
          </div>
        ))}
      </div>

      {/* Status pipeline */}
      <div className="grid gap-3 sm:grid-cols-4">
        {statusCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className={`font-display text-lg font-bold ${color}`}>{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts />

      {/* Recent orders */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Pedidos Recentes</h3>
          <span className="text-[10px] text-muted-foreground">Últimos 5</span>
        </div>
        <div className="divide-y divide-border">
          {stats.recentOrders.map((o) => (
            <div key={o.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{o.shipping_name || "Cliente"}</p>
                <p className="text-[10px] text-muted-foreground">
                  #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusColors[o.status]}`}>
                {statusLabels[o.status]}
              </span>
              <span className="font-display text-sm font-bold text-primary">
                R$ {Number(o.total).toFixed(2).replace(".", ",")}
              </span>
            </div>
          ))}
          {stats.recentOrders.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum pedido recente</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
