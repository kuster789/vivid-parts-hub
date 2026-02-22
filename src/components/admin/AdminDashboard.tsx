import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingBag, DollarSign, Calendar, Truck, TrendingUp, Users, Loader2, ArrowUpRight, ArrowDownRight, Mail, Warehouse, Filter
} from "lucide-react";
import AdminCharts from "@/components/AdminCharts";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, cancelled: 0, customers: 0, leads: 0,
    recentOrders: [] as any[],
  });
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: prodCount },
        { data: orders },
        { count: customerCount },
        { count: leadCount },
        { data: productsData },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, status, created_at, shipping_name, id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("products").select("id, name, brand, price, stock").eq("active", true),
      ]);

      const o = orders || [];
      setAllProducts((productsData as ProductRow[]) || []);
      setStats({
        products: prodCount || 0,
        orders: o.length,
        revenue: o.reduce((s, x) => s + Number(x.total), 0),
        pending: o.filter((x) => x.status === "pending").length,
        shipped: o.filter((x) => x.status === "shipped").length,
        delivered: o.filter((x) => x.status === "delivered").length,
        cancelled: o.filter((x) => x.status === "cancelled").length,
        customers: customerCount || 0,
        leads: leadCount || 0,
        recentOrders: o.slice(0, 5),
      });
      setLoading(false);
    };
    load();
  }, []);

  const brands = useMemo(() => {
    const set = new Set(allProducts.map((p) => p.brand));
    return Array.from(set).sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return selectedBrand ? allProducts.filter((p) => p.brand === selectedBrand) : allProducts;
  }, [allProducts, selectedBrand]);

  const inventoryValue = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);
  }, [filteredProducts]);

  const inventoryCount = useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + p.stock, 0);
  }, [filteredProducts]);

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
    { label: "Leads", value: stats.leads, icon: Mail, trend: "Emails capturados", up: null },
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* Inventory Value */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Valor do Estoque</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Todas as marcas</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground">Valor Total (preço × estoque)</p>
            <p className="mt-1 font-display text-2xl font-black text-primary">
              R$ {inventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground">Produtos Filtrados</p>
            <p className="mt-1 font-display text-2xl font-black text-foreground">{filteredProducts.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground">Unidades em Estoque</p>
            <p className="mt-1 font-display text-2xl font-black text-foreground">{inventoryCount}</p>
          </div>
        </div>

        {/* Top products by value */}
        <div className="divide-y divide-border rounded-lg border border-border">
          <div className="px-4 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top 5 por valor em estoque</p>
          </div>
          {filteredProducts
            .map((p) => ({ ...p, totalValue: Number(p.price) * p.stock }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 5)
            .map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.brand.toUpperCase()} · {p.stock} un. × R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                </div>
                <span className="font-display text-sm font-bold text-primary">
                  R$ {p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          {filteredProducts.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum produto encontrado</p>
          )}
        </div>
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
