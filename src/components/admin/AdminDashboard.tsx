/**
 * Dashboard de Inteligência Comercial - Versão 2.2 (Atualizado em Maio 2026 - Deploy Sync)
 * Focado em elevar o padrão visual, analítico e estratégico.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, ShoppingBag, DollarSign, BarChart3, Globe, Eye, Filter, 
  Search, ShoppingCart, Lightbulb, Warehouse, Loader2, TrendingUp
} from "lucide-react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

import DashboardDateFilter, { type DateRange } from "./dashboard/DashboardDateFilter";
import DashboardFilters from "./dashboard/DashboardFilters";
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
  const [monthlyRev, setMonthlyRev] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
    label: "Últimos 30 dias",
  });
  
  const [advancedFilters, setAdvancedFilters] = useState<{
    utmSource: string | null;
    state: string | null;
    brand: string | null;
  }>({
    utmSource: null,
    state: null,
    brand: null
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfDay(dateRange.from).toISOString();
      const end = endOfDay(dateRange.to).toISOString();
      
      const diff = dateRange.to.getTime() - dateRange.from.getTime();
      const prevStart = new Date(dateRange.from.getTime() - diff).toISOString();
      const prevEnd = start;

      const [
        { data: kpis },
        { data: prevKpis },
        { data: funnel },
        { data: products },
        { data: searches },
        { data: geo },
        { data: inventory },
        { data: recentOrders },
        { data: monthlyRevData },
        { data: opportunities }
      ] = await Promise.all([
        supabase.rpc("get_dashboard_metrics", { 
          start_date: start, 
          end_date: end,
          p_utm_source: advancedFilters.utmSource,
          p_state: advancedFilters.state,
          p_brand: advancedFilters.brand
        }),
        supabase.rpc("get_dashboard_metrics", { 
          start_date: prevStart, 
          end_date: prevEnd,
          p_utm_source: advancedFilters.utmSource,
          p_state: advancedFilters.state,
          p_brand: advancedFilters.brand
        }),
        supabase.rpc("get_sales_funnel", { 
          start_date: start, 
          end_date: end,
          p_utm_source: advancedFilters.utmSource,
          p_state: advancedFilters.state,
          p_brand: advancedFilters.brand
        }),
        supabase.rpc("get_product_performance", { 
          start_date: start, 
          end_date: end, 
          limit_count: 10,
          p_utm_source: advancedFilters.utmSource,
          p_state: advancedFilters.state,
          p_brand: advancedFilters.brand
        }),
        supabase.rpc("get_search_insights", { 
          start_date: start, 
          end_date: end,
          p_utm_source: advancedFilters.utmSource,
          p_state: advancedFilters.state
        }),
        supabase.rpc("get_geo_performance", { start_date: start, end_date: end }),
        supabase.rpc("get_inventory_priority"),
        supabase.from("orders").select("id, total, status, created_at, shipping_name").order("created_at", { ascending: false }).limit(5),
        supabase.rpc("get_monthly_revenue_comparison"),
        supabase.rpc("get_dashboard_opportunities", { start_date: start, end_date: end })
      ]);

      setData({
        kpis,
        funnel: (funnel as any)?.steps || [],
        products: products || [],
        searches: searches || [],
        geo: geo || [],
        inventory: inventory || [],
        recentOrders: recentOrders || [],
        opportunities: opportunities || {}
      });
      setPrevData(prevKpis);
      setMonthlyRev(monthlyRevData || []);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      toast.error("Erro ao carregar dados do painel.");
    } finally {
      setLoading(false);
    }
  }, [dateRange, advancedFilters]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const insights = useMemo(() => {
    if (!data || !data.opportunities) return [];
    const list: any[] = [];
    const opp = data.opportunities;

    // High View Low Purchase
    opp.high_view_low_purchase?.forEach((p: any) => {
      list.push({
        id: `hvp-${p.id}`,
        type: 'warning',
        title: `Atenção: ${p.name}`,
        description: `${p.views} visitas interessadas, mas 0 compras confirmadas.`,
        impact: 'Alta Evasão',
        action: 'Revisar Preço/Frete',
        icon: Eye
      });
    });

    // Empty Searches
    opp.empty_searches?.forEach((s: any, i: number) => {
      list.push({
        id: `es-${i}`,
        type: 'critical',
        title: `Falta de Estoque: "${s.query}"`,
        description: `Buscado ${s.search_count} vezes sem nenhum resultado encontrado.`,
        impact: 'Venda Perdida',
        action: 'Adicionar Produto',
        icon: Search
      });
    });

    // Abandonment by City
    opp.abandonment_by_city?.forEach((a: any, i: number) => {
      list.push({
        id: `abc-${i}`,
        type: 'info',
        title: `Abandono em ${a.city}/${a.state}`,
        description: `Alta taxa de carrinhos (${a.carts}) que não viram checkout (${a.checkouts}).`,
        impact: 'Gargalo Logístico',
        action: 'Verificar Frete Região',
        icon: ShoppingCart
      });
    });

    // Low stock high demand
    opp.low_stock_high_demand?.forEach((l: any) => {
      list.push({
        id: `lshd-${l.id}`,
        type: 'critical',
        title: `Reposição Urgente: ${l.name}`,
        description: `Estoque crítico (${l.stock} un) com alta demanda (${l.views} views).`,
        impact: 'Ruptura de Estoque',
        action: 'Fazer Pedido Compra',
        icon: Warehouse
      });
    });

    return list.sort(() => 0.5 - Math.random()).slice(0, 6);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-display font-bold uppercase tracking-widest">Sincronizando Inteligência Comercial Agrale...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="bg-card/40 p-5 rounded-xl border border-border/60 backdrop-blur-md shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-inner">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Painel de Decisão Comercial</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-80">Motopeças e Autopeças Agrale — Business Intelligence</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <QuickActions onNewSale={() => onNavigate?.("sales")} onExportCSV={() => {}} onExportPDF={() => {}} />
          </div>
        </div>

        <div className="grid gap-4">
           <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t border-border/40 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Período:</span>
            <DashboardDateFilter value={dateRange} onChange={setDateRange} />
          </div>
          <DashboardFilters onFilterChange={setAdvancedFilters} />
        </div>
      </div>

      <div className="grid gap-8">
        <DashboardSection title="Insights Estratégicos Automatizados" icon={Lightbulb}>
          <AutomaticInsights insights={insights} />
        </DashboardSection>

        <div className="grid gap-8 lg:grid-cols-1">
          <DashboardSection title="Visão do Funil de Vendas" icon={Filter}>
            <SalesFunnel steps={data?.funnel} />
          </DashboardSection>
        </div>

        <DashboardSection title="Indicadores Críticos de Performance" icon={DollarSign}>
          <KPIOverview data={data?.kpis} previousData={prevData} />
        </DashboardSection>

        <div className="grid gap-8 lg:grid-cols-2">
          <DashboardSection title="Ranking de Performance por Produto" icon={Package}>
            <ProductPerformance products={data?.products} />
          </DashboardSection>

          <DashboardSection title="Inteligência Geográfica & Logística" icon={Globe}>
            <GeoPerformance data={data?.geo} />
          </DashboardSection>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
           <DashboardSection title="Demanda Reprimida (Buscas sem Resultado)" icon={Search}>
            <SearchInsights searches={data?.searches} />
          </DashboardSection>

          <DashboardSection title="Alertas de Ruptura de Estoque" icon={Warehouse}>
            <SmartInventory items={data?.inventory} />
          </DashboardSection>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
             <DashboardSection title="Tendências Históricas de Faturamento" icon={BarChart3}>
              <MonthlyComparisonChart data={monthlyRev} />
            </DashboardSection>
          </div>
          <div className="lg:col-span-1">
             <DashboardSection title="Últimas Movimentações" icon={ShoppingBag}>
              <RecentOrdersTable orders={data?.recentOrders} />
            </DashboardSection>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-10 border-t border-border/40">
        <button 
          onClick={loadDashboardData}
          className="group flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
        >
          <Loader2 className={`h-4 w-4 transition-transform group-hover:rotate-180 ${loading ? 'animate-spin' : ''}`} />
          Recarregar Inteligência de Vendas
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
