import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, DollarSign, Calendar, Truck, TrendingUp, Users, Loader2, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminCharts from "@/components/AdminCharts";
import VisitorStats from "@/components/admin/VisitorStats";
import GeoStats from "@/components/admin/GeoStats";
import DashboardKPIs, { type KPICard } from "./dashboard/DashboardKPIs";
import StatusPipeline, { type StatusCard } from "./dashboard/StatusPipeline";
import MonthlyComparisonChart from "./dashboard/MonthlyComparisonChart";
import RecentOrdersTable from "./dashboard/RecentOrdersTable";

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

interface DashboardStats {
  orders: number;
  revenue: number;
  pending: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  customers: number;
  leads: number;
  recentOrders: OrderRow[];
  externalRevenue: number;
  externalProfit: number;
  externalCount: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    orders: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, cancelled: 0, customers: 0, leads: 0,
    recentOrders: [],
    externalRevenue: 0, externalProfit: 0, externalCount: 0,
  });
  const [ordersRaw, setOrdersRaw] = useState<OrderRow[]>([]);
  const [salesRaw, setSalesRaw] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { data: orders },
        { count: customerCount },
        { count: leadCount },
        { data: salesData },
      ] = await Promise.all([
        supabase.from("orders").select("total, status, created_at, shipping_name, id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("sales").select("piece_value, net_value, order_date"),
      ]);

      const o = (orders || []) as OrderRow[];
      const s = (salesData || []) as SaleRow[];
      const externalRevenue = s.reduce((sum, x) => sum + Number(x.piece_value), 0);
      const externalProfit = s.reduce((sum, x) => sum + Number(x.net_value || 0), 0);

      setOrdersRaw(o);
      setSalesRaw(s);
      setStats({
        orders: o.length,
        revenue: o.reduce((sum, x) => sum + Number(x.total), 0),
        pending: o.filter((x) => x.status === "pending").length,
        shipped: o.filter((x) => x.status === "shipped").length,
        delivered: o.filter((x) => x.status === "delivered").length,
        cancelled: o.filter((x) => x.status === "cancelled").length,
        customers: customerCount || 0,
        leads: leadCount || 0,
        recentOrders: o.slice(0, 5),
        externalRevenue,
        externalProfit,
        externalCount: s.length,
      });
      setLoading(false);
    };
    load();
  }, []);

  const monthlyComparison = useMemo(() => {
    const map: Record<string, { site: number; externo: number }> = {};
    ordersRaw.forEach((o) => {
      const key = format(new Date(o.created_at), "MMM/yy", { locale: ptBR });
      if (!map[key]) map[key] = { site: 0, externo: 0 };
      map[key].site += Number(o.total);
    });
    salesRaw.forEach((s) => {
      const key = format(new Date(s.order_date), "MMM/yy", { locale: ptBR });
      if (!map[key]) map[key] = { site: 0, externo: 0 };
      map[key].externo += Number(s.piece_value);
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [ordersRaw, salesRaw]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalRevenue = stats.revenue + stats.externalRevenue;

  const mainCards: KPICard[] = [
    { label: "Receita Total", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, trend: `Site: R$ ${stats.revenue.toFixed(0)} + Externo: R$ ${stats.externalRevenue.toFixed(0)}`, up: true },
    { label: "Pedidos (Site)", value: stats.orders, icon: ShoppingBag, trend: `${stats.pending} pendentes`, up: null },
    { label: "Vendas Externas", value: stats.externalCount, icon: TrendingUp, trend: `Lucro: R$ ${stats.externalProfit.toFixed(2).replace(".", ",")}`, up: stats.externalProfit > 0 },
    { label: "Clientes", value: stats.customers, icon: Users, trend: "Registrados", up: null },
    { label: "Leads", value: stats.leads, icon: Mail, trend: "Emails capturados", up: null },
  ];

  const statusCards: StatusCard[] = [
    { label: "Pendentes", value: stats.pending, variant: "warning", icon: Calendar },
    { label: "Enviados", value: stats.shipped, variant: "info", icon: Truck },
    { label: "Entregues", value: stats.delivered, variant: "success", icon: TrendingUp },
    { label: "Cancelados", value: stats.cancelled, variant: "destructive", icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <DashboardKPIs cards={mainCards} />
      <StatusPipeline cards={statusCards} />
      <MonthlyComparisonChart data={monthlyComparison} />
      <VisitorStats />
      <GeoStats />
      <AdminCharts />
      <RecentOrdersTable orders={stats.recentOrders} />
    </div>
  );
};

export default AdminDashboard;
