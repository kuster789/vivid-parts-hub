import { useMemo } from "react";
import { 
  Users, Eye, MousePointer2, ShoppingCart, CreditCard, 
  ShoppingBag, DollarSign, Ban, Percent, TrendingUp,
  Package, Mail, ClipboardList, AlertCircle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface KPI {
  label: string;
  value: string | number;
  comparison?: string | number;
  change?: number;
  icon: any;
  tooltip: string;
  format?: 'currency' | 'percent' | 'number';
}

interface KPIOverviewProps {
  data: any;
  previousData?: any;
}

const KPIOverview = ({ data, previousData }: KPIOverviewProps) => {
  const kpis: KPI[] = useMemo(() => {
    if (!data) return [];

    const calculateChange = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    const formatValue = (val: number, type?: string) => {
      if (type === 'currency') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      if (type === 'percent') return `${val.toFixed(1)}%`;
      return val.toLocaleString('pt-BR');
    };

    const mainKpis: KPI[] = [
      { 
        label: "Visitantes Únicos", 
        value: data.unique_visitors || 0, 
        icon: Users, 
        tooltip: "Número de usuários únicos baseados em session_id.",
        change: calculateChange(data.unique_visitors || 0, previousData?.unique_visitors || 0)
      },
      { 
        label: "Sessões", 
        value: data.sessions || data.unique_visitors || 0, 
        icon: TrendingUp, 
        tooltip: "Total de sessões iniciadas no período." 
      },
      { 
        label: "Visualizações de Página", 
        value: data.page_views || 0, 
        icon: Eye, 
        tooltip: "Total de visualizações de páginas (page_view)." 
      },
      { 
        label: "Visualizações de Produto", 
        value: data.product_views || 0, 
        icon: Package, 
        tooltip: "Total de visualizações de detalhes de produtos." 
      },
      { 
        label: "Cliques em WhatsApp", 
        value: data.whatsapp_clicks || 0, 
        icon: MousePointer2, 
        tooltip: "Total de cliques no botão de WhatsApp." 
      },
      { 
        label: "Add ao Carrinho", 
        value: data.cart_additions || 0, 
        icon: ShoppingCart, 
        tooltip: "Número de vezes que produtos foram adicionados ao carrinho." 
      },
      { 
        label: "Checkouts Iniciados", 
        value: data.checkouts_started || 0, 
        icon: CreditCard, 
        tooltip: "Número de usuários que chegaram à tela de checkout." 
      },
      { 
        label: "Pedidos Criados", 
        value: data.orders_created || 0, 
        icon: ShoppingBag, 
        tooltip: "Total de pedidos gerados no banco de dados." 
      },
      { 
        label: "Pedidos Pagos", 
        value: data.orders_paid || 0, 
        icon: CheckCircle2, 
        tooltip: "Pedidos com status aprovado/pago." 
      },
      { 
        label: "Orçamentos", 
        value: data.quotes_requested || 0, 
        icon: ClipboardList, 
        tooltip: "Solicitações de orçamento via formulário ou WhatsApp." 
      },
      { 
        label: "Leads Captados", 
        value: data.leads_count || 0, 
        icon: Mail, 
        tooltip: "Novos contatos captados via popup ou newsletter." 
      },
      { 
        label: "Receita Total", 
        value: data.revenue_total || 0, 
        format: 'currency', 
        icon: DollarSign, 
        tooltip: "Soma do valor total de todos os pedidos criados." 
      },
      { 
        label: "Receita Aprovada", 
        value: data.revenue_approved || 0, 
        format: 'currency', 
        icon: DollarSign, 
        tooltip: "Soma do valor total dos pedidos pagos." 
      },
      { 
        label: "Ticket Médio", 
        value: data.orders_paid > 0 ? data.revenue_approved / data.orders_paid : 0, 
        format: 'currency', 
        icon: DollarSign, 
        tooltip: "Valor médio de cada venda aprovada." 
      },
      { 
        label: "Conversão Geral", 
        value: data.unique_visitors > 0 ? (data.orders_paid / data.unique_visitors) * 100 : 0, 
        format: 'percent', 
        icon: Percent, 
        tooltip: "Porcentagem de visitantes que concluíram uma compra." 
      },
      { 
        label: "Conv. Produto → Carrinho", 
        value: data.product_views > 0 ? (data.cart_additions / data.product_views) * 100 : 0, 
        format: 'percent', 
        icon: Percent, 
        tooltip: "Porcentagem de visualizações de produto que geraram adição ao carrinho." 
      },
      { 
        label: "Carrinhos Abandonados", 
        value: data.abandoned_carts || 0, 
        icon: Ban, 
        tooltip: "Carrinhos que foram criados mas não geraram checkout." 
      },
      { 
        label: "Produtos s/ Estoque", 
        value: data.out_of_stock_views || 0, 
        icon: AlertCircle, 
        tooltip: "Visualizações de produtos que estão indisponíveis no estoque." 
      }
    ];

    return mainKpis;
  }, [data, previousData]);

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <TooltipProvider>
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="cursor-help text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">{kpi.tooltip}</p>
                </TooltipContent>
              </Tooltip>
              <kpi.icon className="h-4 w-4 text-primary/60" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {typeof kpi.value === 'number' ? 
                  (kpi.format === 'currency' ? 
                    `R$ ${kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                    (kpi.format === 'percent' ? `${kpi.value.toFixed(1)}%` : kpi.value.toLocaleString('pt-BR'))) 
                  : kpi.value}
              </div>
              {kpi.change !== undefined && kpi.change !== 0 && (
                <p className={`flex items-center text-[10px] ${kpi.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}% vs anterior
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default KPIOverview;

const CheckCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
