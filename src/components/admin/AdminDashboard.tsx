import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingBag, DollarSign, Calendar, Truck, TrendingUp, Users, Loader2, ArrowUpRight, ArrowDownRight, Mail, Warehouse, Filter, Download, FileText, AlertTriangle, Pencil
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AdminCharts from "@/components/AdminCharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CONDITION_COLORS = ["hsl(38, 92%, 50%)", "hsl(200, 70%, 50%)"];

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  condition: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, cancelled: 0, customers: 0, leads: 0,
    recentOrders: [] as any[],
  });
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [editStock, setEditStock] = useState("");
  const [saving, setSaving] = useState(false);
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
        supabase.from("products").select("id, name, brand, price, stock, condition").eq("active", true),
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

  const brandChartData = useMemo(() => {
    const map: Record<string, { value: number; count: number; units: number }> = {};
    allProducts.forEach((p) => {
      if (!map[p.brand]) map[p.brand] = { value: 0, count: 0, units: 0 };
      map[p.brand].value += Number(p.price) * p.stock;
      map[p.brand].count += 1;
      map[p.brand].units += p.stock;
    });
    return Object.entries(map)
      .map(([brand, d]) => ({ brand: brand.charAt(0).toUpperCase() + brand.slice(1), valor: Math.round(d.value * 100) / 100, produtos: d.count, unidades: d.units }))
      .sort((a, b) => b.valor - a.valor);
  }, [allProducts]);

  const conditionChartData = useMemo(() => {
    const novas = filteredProducts.filter((p) => p.condition !== "usada").length;
    const usadas = filteredProducts.filter((p) => p.condition === "usada").length;
    return [
      { name: "Novas", value: novas },
      { name: "Usadas", value: usadas },
    ].filter((d) => d.value > 0);
  }, [filteredProducts]);

  const exportCSV = useCallback(() => {
    const header = "Marca,Produto,Preço,Estoque,Condição,Valor Total\n";
    const rows = filteredProducts
      .map((p) => `${p.brand},"${p.name.replace(/"/g, '""')}",${Number(p.price).toFixed(2)},${p.stock},${p.condition === "usada" ? "Usada" : "Nova"},${(Number(p.price) * p.stock).toFixed(2)}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estoque${selectedBrand ? `-${selectedBrand}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredProducts, selectedBrand]);

  const exportPDF = useCallback(() => {
    const title = `Relatório de Estoque${selectedBrand ? ` - ${selectedBrand.charAt(0).toUpperCase() + selectedBrand.slice(1)}` : ""}`;
    const date = new Date().toLocaleDateString("pt-BR");
    const sorted = [...filteredProducts]
      .map((p) => ({ ...p, totalValue: Number(p.price) * p.stock }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const html = `
      <html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .date { color: #888; font-size: 12px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-card { background: #f5f5f5; padding: 12px 16px; border-radius: 8px; }
        .summary-card .label { font-size: 11px; color: #888; }
        .summary-card .value { font-size: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #fafafa; }
        .text-right { text-align: right; }
      </style></head><body>
      <h1>${title}</h1>
      <p class="date">Gerado em ${date}</p>
      <div class="summary">
        <div class="summary-card"><div class="label">Valor Total</div><div class="value">R$ ${inventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
        <div class="summary-card"><div class="label">Produtos</div><div class="value">${filteredProducts.length}</div></div>
        <div class="summary-card"><div class="label">Unidades</div><div class="value">${inventoryCount}</div></div>
      </div>
      <table>
        <thead><tr><th>Produto</th><th>Marca</th><th>Condição</th><th class="text-right">Preço</th><th class="text-right">Estoque</th><th class="text-right">Valor Total</th></tr></thead>
        <tbody>${sorted.map((p) => `<tr><td>${p.name}</td><td>${p.brand.toUpperCase()}</td><td>${p.condition === "usada" ? "Usada" : "Nova"}</td><td class="text-right">R$ ${Number(p.price).toFixed(2).replace(".", ",")}</td><td class="text-right">${p.stock}</td><td class="text-right">R$ ${p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>`).join("")}</tbody>
      </table>
      </body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  }, [filteredProducts, selectedBrand, inventoryValue, inventoryCount]);

  const handleSaveStock = useCallback(async () => {
    if (!editProduct) return;
    const newStock = parseInt(editStock, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Quantidade inválida");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", editProduct.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao atualizar estoque");
      return;
    }
    setAllProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, stock: newStock } : p)));
    toast.success(`Estoque de "${editProduct.name}" atualizado para ${newStock}`);
    setEditProduct(null);
  }, [editProduct, editStock]);

  const openStockEditor = (product: ProductRow) => {
    setEditProduct(product);
    setEditStock(String(product.stock));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const lowStockProducts = allProducts.filter((p) => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = allProducts.filter((p) => p.stock === 0);

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

      {/* Low Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-3">
          {outOfStockProducts.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive">Sem Estoque — {outOfStockProducts.length} produto(s)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {outOfStockProducts.slice(0, 8).map((p) => (
                    <button key={p.id} onClick={() => openStockEditor(p)} className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/25 transition-colors cursor-pointer">
                      {p.name} <span className="opacity-60">({p.brand.toUpperCase()})</span>
                    </button>
                  ))}
                  {outOfStockProducts.length > 8 && (
                    <span className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-medium text-destructive">
                      +{outOfStockProducts.length - 8} mais
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-bold text-yellow-500">Estoque Baixo (&lt;5 un.) — {lowStockProducts.length} produto(s)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lowStockProducts.slice(0, 8).map((p) => (
                    <button key={p.id} onClick={() => openStockEditor(p)} className="rounded-md bg-yellow-500/15 px-2 py-1 text-[11px] font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 transition-colors cursor-pointer">
                      {p.name} <span className="opacity-60">({p.stock} un.)</span>
                    </button>
                  ))}
                  {lowStockProducts.length > 8 && (
                    <span className="rounded-md bg-yellow-500/15 px-2 py-1 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
                      +{lowStockProducts.length - 8} mais
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
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

        {/* Charts row: bar + pie */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border p-4 lg:col-span-2">
            <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Valor do Estoque por Marca</p>
            {brandChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={brandChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
                  <XAxis dataKey="brand" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
                  />
                  <Bar dataKey="valor" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
            )}
          </div>

          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Condição das Peças</p>
            {conditionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={conditionChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {conditionChartData.map((_, i) => (
                      <Cell key={i} fill={CONDITION_COLORS[i % CONDITION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
            )}
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
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5 group cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => openStockEditor(p)}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.brand.toUpperCase()} · {p.stock} un. × R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="font-display text-sm font-bold text-primary">
                    R$ {p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
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

      {/* Stock Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => !open && setEditProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Estoque</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">{editProduct.name}</p>
                <p className="text-xs text-muted-foreground">{editProduct.brand.toUpperCase()} · Estoque atual: {editProduct.stock} un.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nova quantidade</label>
                <Input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="mt-1"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveStock()}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancelar</Button>
            <Button onClick={handleSaveStock} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
