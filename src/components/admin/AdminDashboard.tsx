import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, ShoppingBag, DollarSign, Calendar, Truck, TrendingUp, 
  Users, Loader2, Mail, BarChart3, Globe, Eye, Filter, 
  Search, ShoppingCart, Lightbulb, Warehouse
} from "lucide-react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

import DashboardDateFilter, { type DateRange } from "./dashboard/DashboardDateFilter";
import QuickActions from "./dashboard/QuickActions";
import DashboardSection from "./dashboard/DashboardSection";

// New Components
import KPIOverview from "./dashboard/KPIOverview";
import SalesFunnel from "./dashboard/SalesFunnel";
import ProductPerformance from "./dashboard/ProductPerformance";
import SearchInsights from "./dashboard/SearchInsights";
import GeoPerformance from "./dashboard/GeoPerformance";
import SmartInventory from "./dashboard/SmartInventory";
import AutomaticInsights from "./dashboard/AutomaticInsights";

// Existing components we'll still use
import MonthlyComparisonChart from "./dashboard/MonthlyComparisonChart";
import RecentOrdersTable from "./dashboard/RecentOrdersTable";

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

const AdminDashboard = ({ onNavigate }: AdminDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [prevData, setPrevData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
    label: "Últimos 30 dias",
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfDay(dateRange.from).toISOString();
      const end = endOfDay(dateRange.to).toISOString();
      
      // Calculate previous period for comparison
      const diff = dateRange.to.getTime() - dateRange.from.getTime();
      const prevStart = new Date(dateRange.from.getTime() - diff).toISOString();
      const prevEnd = start;
  const [monthlyRev, setMonthlyRev] = useState<any[]>([]);

      const [
        { data: kpis },
        { data: prevKpis },
        { data: funnel },
        { data: products },
        { data: searches },
        { data: geo },
        { data: inventory },
        { data: recentOrders }
      ] = await Promise.all([
        supabase.rpc("get_dashboard_metrics", { start_date: start, end_date: end }),
        supabase.rpc("get_dashboard_metrics", { start_date: prevStart, end_date: prevEnd }),
        supabase.rpc("get_sales_funnel", { start_date: start, end_date: end }),
        supabase.rpc("get_product_performance", { start_date: start, end_date: end, limit_count: 10 }),
        supabase.rpc("get_search_insights", { start_date: start, end_date: end }),
        supabase.rpc("get_geo_performance", { start_date: start, end_date: end }),
        supabase.rpc("get_inventory_priority"),
        supabase.from("orders").select("id, total, status, created_at, shipping_name").order("created_at", { ascending: false }).limit(5)
      ]);

        setData({
        kpis,
        funnel: (funnel as any)?.steps || [],
        products: products || [],
        searches: searches || [],
        geo: geo || [],
        inventory: inventory || [],
        recentOrders: recentOrders || []
      });
      setPrevData(prevKpis);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      toast.error("Erro ao carregar dados do painel.");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const insights = useMemo(() => {
    if (!data) return [];
    const list: any[] = [];

    // Rule: High views, no sales
    data.products?.forEach((p: any) => {
      if (p.views > 50 && p.orders === 0) {
        list.push({
          id: `p-${p.product_id}`,
          type: 'warning',
          title: `Baixa Conversão: ${p.name}`,
          description: `${p.views} pessoas viram este produto, mas ninguém comprou.`,
          impact: 'Perda de Venda',
          action: 'Revisar Preço/Fotos',
          icon: Eye
        });
      }
    });

    // Rule: Search without results
    data.searches?.slice(0, 3).forEach((s: any, i: number) => {
      if (s.no_results && s.search_count > 5) {
        list.push({
          id: `s-${i}`,
          type: 'critical',
          title: `Oportunidade: "${s.query}"`,
          description: `Este termo foi buscado ${s.search_count} vezes sem nenhum resultado encontrado.`,
          impact: 'Demanda Não Atendida',
          action: 'Cadastrar Produto',
          icon: Search
        });
      }
    });

    // Rule: High dropoff
    const cartStep = data.funnel?.find((s: any) => s.name.includes("Carrinho"));
    const checkoutStep = data.funnel?.find((s: any) => s.name.includes("Checkout"));
    if (cartStep && checkoutStep) {
      const dropoff = 100 - (checkoutStep.count / (cartStep.count || 1)) * 100;
      if (dropoff > 60) {
        list.push({
          id: 'funnel-dropoff',
          type: 'critical',
          title: 'Abandono de Carrinho Alto',
          description: `${dropoff.toFixed(0)}% dos usuários abandonam no carrinho.`,
          impact: 'Gargalo de Vendas',
          action: 'Verificar Frete/Checkout',
          icon: ShoppingCart
        });
      }
    }

    return list.slice(0, 6);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Consolidando inteligência comercial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header: Date filter + Quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/30 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Visão Executiva</h2>
            <p className="text-xs text-muted-foreground">Monitoramento de performance em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DashboardDateFilter value={dateRange} onChange={setDateRange} />
          <QuickActions onNewSale={() => onNavigate?.("sales")} onExportCSV={() => {}} onExportPDF={() => {}} />
        </div>
      </div>

      {/* 🚀 Principais Insights */}
      {insights.length > 0 && (
        <DashboardSection title="Insights Automáticos" icon={Lightbulb}>
          <AutomaticInsights insights={insights} />
        </DashboardSection>
      )}

      {/* 💰 KPIs Principais */}
      <DashboardSection title="Indicadores de Performance (KPIs)" icon={DollarSign}>
        <KPIOverview data={data?.kpis} previousData={prevData} />
      </DashboardSection>

      {/* 🌪️ Funil de Vendas */}
      <DashboardSection title="Funil de Conversão" icon={Filter}>
        <SalesFunnel steps={data?.funnel} />
      </DashboardSection>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 📦 Performance de Produtos */}
        <div className="lg:col-span-2">
           <DashboardSection title="Performance de Produtos" icon={Package}>
            <ProductPerformance products={data?.products} />
          </DashboardSection>
        </div>

        {/* 🔍 Buscas e Oportunidades */}
        <DashboardSection title="Buscas dos Clientes" icon={Search}>
          <SearchInsights searches={data?.searches} />
        </DashboardSection>

        {/* 🏢 Estoque Inteligente */}
        <DashboardSection title="Prioridade de Estoque" icon={Warehouse}>
          <SmartInventory items={data?.inventory} />
        </DashboardSection>
      </div>

      {/* 🌍 Audiência e Geografia */}
      <DashboardSection title="Performance Geográfica (Normalizada)" icon={Globe}>
        <GeoPerformance data={data?.geo} />
      </DashboardSection>

      {/* 🛒 Vendas e Pedidos */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardSection title="Pedidos Recentes" icon={ShoppingBag}>
            <RecentOrdersTable orders={data?.recentOrders} />
          </DashboardSection>
        </div>
        <DashboardSection title="Canais de Venda" icon={BarChart3}>
           <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-card/30">
            <p className="text-xs text-muted-foreground">
              Gráfico de Origem (UTMs) vindo em breve.
            </p>
          </div>
        </DashboardSection>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={loadDashboardData}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <Loader2 className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados do Painel
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
