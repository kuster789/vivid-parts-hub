import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, DollarSign, Calendar, Truck, TrendingUp, Users, Loader2, Mail, BarChart3, Globe, Eye } from "lucide-react";
import { format, subDays, isAfter, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminCharts from "@/components/AdminCharts";
import VisitorStats from "@/components/admin/VisitorStats";
import GeoStats from "@/components/admin/GeoStats";
import { toast } from "sonner";
import DashboardKPIs, { type KPICard } from "./dashboard/DashboardKPIs";
import StatusPipeline, { type StatusCard } from "./dashboard/StatusPipeline";
import StockAlerts from "./dashboard/StockAlerts";
import InventorySection from "./dashboard/InventorySection";
import MonthlyComparisonChart from "./dashboard/MonthlyComparisonChart";
import RecentOrdersTable from "./dashboard/RecentOrdersTable";
import StockEditDialog from "./dashboard/StockEditDialog";
import DashboardDateFilter, { type DateRange } from "./dashboard/DashboardDateFilter";
import QuickActions from "./dashboard/QuickActions";
import PriorityAlerts from "./dashboard/PriorityAlerts";
import DashboardSection from "./dashboard/DashboardSection";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  condition: string;
}

interface OrderRow {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_name: string | null;
}

interface SaleRow {
  piece_value: number;
  net_value: number | null;
  order_date: string;
}

const AdminDashboard = () => {
  const [ordersRaw, setOrdersRaw] = useState<OrderRow[]>([]);
  const [salesRaw, setSalesRaw] = useState<SaleRow[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [editStock, setEditStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [prodCount, setProdCount] = useState(0);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
    label: "Últimos 30 dias",
  });

  useEffect(() => {
    const load = async () => {
      const [
        { count: pc },
        { data: orders },
        { count: cc },
        { count: lc },
        { data: productsData },
        { data: salesData },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, status, created_at, shipping_name, id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("products").select("id, name, brand, price, stock, condition").eq("active", true),
        supabase.from("sales").select("piece_value, net_value, order_date"),
      ]);

      setAllProducts((productsData as ProductRow[]) || []);
      setOrdersRaw((orders || []) as OrderRow[]);
      setSalesRaw((salesData || []) as SaleRow[]);
      setCustomerCount(cc || 0);
      setLeadCount(lc || 0);
      setProdCount(pc || 0);
      setLoading(false);
    };
    load();
  }, []);

  // Filter by date range
  const filteredOrders = useMemo(() =>
    ordersRaw.filter((o) => {
      const d = new Date(o.created_at);
      return isAfter(d, startOfDay(dateRange.from)) && d <= dateRange.to;
    }),
    [ordersRaw, dateRange]
  );

  const filteredSales = useMemo(() =>
    salesRaw.filter((s) => {
      const d = new Date(s.order_date);
      return isAfter(d, startOfDay(dateRange.from)) && d <= dateRange.to;
    }),
    [salesRaw, dateRange]
  );

  // Sparkline data: daily values for last N days
  const buildSparkline = useCallback((items: { date: Date; value: number }[], days: number) => {
    const result: number[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(subDays(now, i));
      const nextDay = startOfDay(subDays(now, i - 1));
      const total = items
        .filter((it) => it.date >= day && it.date < nextDay)
        .reduce((sum, it) => sum + it.value, 0);
      result.push(total);
    }
    return result;
  }, []);

  const sparkDays = Math.min(differenceInDays(dateRange.to, dateRange.from), 30) || 7;

  const revenueSparkline = useMemo(() =>
    buildSparkline(filteredOrders.map((o) => ({ date: new Date(o.created_at), value: Number(o.total) })), sparkDays),
    [filteredOrders, sparkDays, buildSparkline]
  );

  const ordersSparkline = useMemo(() =>
    buildSparkline(filteredOrders.map((o) => ({ date: new Date(o.created_at), value: 1 })), sparkDays),
    [filteredOrders, sparkDays, buildSparkline]
  );

  const salesSparkline = useMemo(() =>
    buildSparkline(filteredSales.map((s) => ({ date: new Date(s.order_date), value: Number(s.piece_value) })), sparkDays),
    [filteredSales, sparkDays, buildSparkline]
  );

  // Stats computed from filtered data
  const revenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + Number(o.total), 0), [filteredOrders]);
  const pending = useMemo(() => filteredOrders.filter((o) => o.status === "pending").length, [filteredOrders]);
  const shipped = useMemo(() => filteredOrders.filter((o) => o.status === "shipped").length, [filteredOrders]);
  const delivered = useMemo(() => filteredOrders.filter((o) => o.status === "delivered").length, [filteredOrders]);
  const cancelled = useMemo(() => filteredOrders.filter((o) => o.status === "cancelled").length, [filteredOrders]);
  const externalRevenue = useMemo(() => filteredSales.reduce((sum, s) => sum + Number(s.piece_value), 0), [filteredSales]);
  const externalProfit = useMemo(() => filteredSales.reduce((sum, s) => sum + Number(s.net_value || 0), 0), [filteredSales]);

  const brands = useMemo(() => Array.from(new Set(allProducts.map((p) => p.brand))).sort(), [allProducts]);
  const filteredProducts = useMemo(() => selectedBrand ? allProducts.filter((p) => p.brand === selectedBrand) : allProducts, [allProducts, selectedBrand]);
  const inventoryValue = useMemo(() => filteredProducts.reduce((sum, p) => sum + Number(p.price) * p.stock, 0), [filteredProducts]);
  const inventoryCount = useMemo(() => filteredProducts.reduce((sum, p) => sum + p.stock, 0), [filteredProducts]);

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
    return [{ name: "Novas", value: novas }, { name: "Usadas", value: usadas }].filter((d) => d.value > 0);
  }, [filteredProducts]);

  const monthlyComparison = useMemo(() => {
    const map: Record<string, { site: number; externo: number }> = {};
    filteredOrders.forEach((o) => {
      const key = format(new Date(o.created_at), "MMM/yy", { locale: ptBR });
      if (!map[key]) map[key] = { site: 0, externo: 0 };
      map[key].site += Number(o.total);
    });
    filteredSales.forEach((s) => {
      const key = format(new Date(s.order_date), "MMM/yy", { locale: ptBR });
      if (!map[key]) map[key] = { site: 0, externo: 0 };
      map[key].externo += Number(s.piece_value);
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [filteredOrders, filteredSales]);

  const topProducts = useMemo(() =>
    filteredProducts
      .map((p) => ({ ...p, totalValue: Number(p.price) * p.stock }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5),
    [filteredProducts]
  );

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
    const sorted = [...filteredProducts].map((p) => ({ ...p, totalValue: Number(p.price) * p.stock })).sort((a, b) => b.totalValue - a.totalValue);
    const html = `<html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{font-size:18px;margin-bottom:4px}.date{color:#888;font-size:12px;margin-bottom:20px}.summary{display:flex;gap:20px;margin-bottom:20px}.summary-card{background:#f5f5f5;padding:12px 16px;border-radius:8px}.summary-card .label{font-size:11px;color:#888}.summary-card .value{font-size:20px;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f0f0f0;text-align:left;padding:8px;border-bottom:2px solid #ddd}td{padding:8px;border-bottom:1px solid #eee}tr:nth-child(even){background:#fafafa}.text-right{text-align:right}</style></head><body><h1>${title}</h1><p class="date">Gerado em ${date}</p><div class="summary"><div class="summary-card"><div class="label">Valor Total</div><div class="value">R$ ${inventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div><div class="summary-card"><div class="label">Produtos</div><div class="value">${filteredProducts.length}</div></div><div class="summary-card"><div class="label">Unidades</div><div class="value">${inventoryCount}</div></div></div><table><thead><tr><th>Produto</th><th>Marca</th><th>Condição</th><th class="text-right">Preço</th><th class="text-right">Estoque</th><th class="text-right">Valor Total</th></tr></thead><tbody>${sorted.map((p) => `<tr><td>${p.name}</td><td>${p.brand.toUpperCase()}</td><td>${p.condition === "usada" ? "Usada" : "Nova"}</td><td class="text-right">R$ ${Number(p.price).toFixed(2).replace(".", ",")}</td><td class="text-right">${p.stock}</td><td class="text-right">R$ ${p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>`).join("")}</tbody></table></body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) { printWindow.document.write(html); printWindow.document.close(); printWindow.onload = () => printWindow.print(); }
  }, [filteredProducts, selectedBrand, inventoryValue, inventoryCount]);

  const handleSaveStock = useCallback(async () => {
    if (!editProduct) return;
    const newStock = parseInt(editStock, 10);
    if (isNaN(newStock) || newStock < 0) { toast.error("Quantidade inválida"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", editProduct.id);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar estoque"); return; }
    setAllProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, stock: newStock } : p)));
    toast.success(`Estoque de "${editProduct.name}" atualizado para ${newStock}`);
    setEditProduct(null);
  }, [editProduct, editStock]);

  const openStockEditor = (product: ProductRow) => { setEditProduct(product); setEditStock(String(product.stock)); };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const lowStockProducts = allProducts.filter((p) => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = allProducts.filter((p) => p.stock === 0);
  const totalRevenue = revenue + externalRevenue;

  const mainCards: KPICard[] = [
    { label: "Receita Total", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, trend: `Site: R$ ${revenue.toFixed(0)} + Externo: R$ ${externalRevenue.toFixed(0)}`, up: true, sparkline: revenueSparkline },
    { label: "Pedidos (Site)", value: filteredOrders.length, icon: ShoppingBag, trend: `${pending} pendentes`, up: null, sparkline: ordersSparkline },
    { label: "Vendas Externas", value: filteredSales.length, icon: TrendingUp, trend: `Lucro: R$ ${externalProfit.toFixed(2).replace(".", ",")}`, up: externalProfit > 0, sparkline: salesSparkline },
    { label: "Produtos", value: prodCount, icon: Package, trend: "Ativos no catálogo", up: null },
    { label: "Clientes", value: customerCount, icon: Users, trend: "Registrados", up: null },
    { label: "Leads", value: leadCount, icon: Mail, trend: "Emails capturados", up: null },
  ];

  const statusCards: StatusCard[] = [
    { label: "Pendentes", value: pending, variant: "warning", icon: Calendar },
    { label: "Enviados", value: shipped, variant: "info", icon: Truck },
    { label: "Entregues", value: delivered, variant: "success", icon: TrendingUp },
    { label: "Cancelados", value: cancelled, variant: "destructive", icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Header: Date filter + Quick actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardDateFilter value={dateRange} onChange={setDateRange} />
        <QuickActions onExportCSV={exportCSV} onExportPDF={exportPDF} />
      </div>

      {/* Priority Alerts */}
      <PriorityAlerts orders={ordersRaw} outOfStock={outOfStockProducts} />

      {/* 💰 Financeiro */}
      <DashboardSection title="Financeiro" icon={DollarSign}>
        <DashboardKPIs cards={mainCards} />
      </DashboardSection>

      {/* 📦 Operacional */}
      <DashboardSection title="Operacional" icon={ShoppingBag}>
        <StatusPipeline cards={statusCards} />
        <StockAlerts outOfStock={outOfStockProducts} lowStock={lowStockProducts} onEdit={openStockEditor} />
        <InventorySection
          brands={brands}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          inventoryValue={inventoryValue}
          filteredCount={filteredProducts.length}
          inventoryCount={inventoryCount}
          brandChartData={brandChartData}
          conditionChartData={conditionChartData}
          topProducts={topProducts}
          onExportCSV={exportCSV}
          onExportPDF={exportPDF}
          onEditProduct={openStockEditor}
        />
      </DashboardSection>

      {/* 📊 Tendências */}
      <DashboardSection title="Tendências" icon={BarChart3}>
        <MonthlyComparisonChart data={monthlyComparison} />
        <AdminCharts />
      </DashboardSection>

      {/* 🌍 Audiência */}
      <DashboardSection title="Audiência" icon={Globe}>
        <VisitorStats />
        <GeoStats />
      </DashboardSection>

      {/* Pedidos recentes */}
      <DashboardSection title="Pedidos Recentes" icon={Eye}>
        <RecentOrdersTable orders={filteredOrders.slice(0, 5)} />
      </DashboardSection>

      <StockEditDialog
        product={editProduct}
        stockValue={editStock}
        onStockChange={setEditStock}
        onSave={handleSaveStock}
        onClose={() => setEditProduct(null)}
        saving={saving}
      />
    </div>
  );
};

export default AdminDashboard;
