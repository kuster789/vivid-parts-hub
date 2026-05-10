import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, AlertTriangle, Lightbulb } from "lucide-react";

interface Step {
  name: string;
  count: number;
}

interface SalesFunnelProps {
  steps: Step[];
}

const SalesFunnel = ({ steps }: SalesFunnelProps) => {
  const funnelData = useMemo(() => {
    if (!steps || steps.length === 0) return [];
    
    return steps.map((step, index) => {
      const nextStep = steps[index + 1];
      const conversion = nextStep ? (nextStep.count / (step.count || 1)) * 100 : null;
      const dropoff = nextStep ? 100 - conversion! : null;
      
      return {
        ...step,
        conversion,
        dropoff
      };
    });
  }, [steps]);

  const insights = useMemo(() => {
    if (!funnelData || funnelData.length < 2) return [];
    
    const messages = [];
    
    // Check for high dropoff between cart and checkout
    const cartIdx = funnelData.findIndex(s => s.name.toLowerCase().includes("carrinho"));
    const checkoutIdx = funnelData.findIndex(s => s.name.toLowerCase().includes("checkout"));
    
    if (cartIdx !== -1 && checkoutIdx !== -1) {
      const conversion = funnelData[cartIdx].conversion;
      if (conversion && conversion < 40) {
        messages.push({
          type: 'alert',
          text: `Atenção: ${(100 - conversion).toFixed(0)}% dos usuários que adicionam ao carrinho não iniciam checkout. Verificar frete, prazo ou obrigatoriedade de login.`
        });
      }
    }

    // Check for dropoff between checkout and order
    const orderIdx = funnelData.findIndex(s => s.name.toLowerCase().includes("pedido"));
    if (checkoutIdx !== -1 && orderIdx !== -1) {
      const conversion = funnelData[checkoutIdx].conversion;
      if (conversion && conversion < 50) {
        messages.push({
          type: 'insight',
          text: `Gargalo no Checkout: Apenas ${conversion.toFixed(0)}% dos checkouts iniciados viram pedido. Avalie simplificar os campos do formulário.`
        });
      }
    }

    return messages;
  }, [funnelData]);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Funil de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{step.name}</div>
                  <div className="relative flex-1">
                    <div className="h-10 w-full rounded-md bg-secondary/50 overflow-hidden">
                      <div 
                        className="h-full bg-primary/20 transition-all duration-1000" 
                        style={{ width: `${(step.count / (funnelData[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold text-foreground">
                      <span>{step.count.toLocaleString('pt-BR')}</span>
                      {i === 0 && <span>100%</span>}
                      {i > 0 && <span>{((step.count / (funnelData[0]?.count || 1)) * 100).toFixed(1)}% do total</span>}
                    </div>
                  </div>
                </div>
                {step.conversion !== null && (
                  <div className="ml-[10rem] flex items-center gap-2 py-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 rotate-90" />
                    <span className="text-[10px] font-bold text-muted-foreground/60">
                      CONVERSÃO: <span className="text-primary">{step.conversion.toFixed(1)}%</span>
                    </span>
                    <span className="text-[10px] font-medium text-red-500/60 ml-2">
                      QUEDA: {step.dropoff?.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {insights.map((msg, i) => (
          <Card key={i} className={`border-l-4 ${msg.type === 'alert' ? 'border-l-red-500' : 'border-l-amber-500'} border-border/50 bg-card/50`}>
            <CardContent className="flex gap-3 p-4">
              {msg.type === 'alert' ? 
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" /> : 
                <Lightbulb className="h-5 w-5 shrink-0 text-amber-500" />
              }
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-foreground uppercase block mb-1">
                  {msg.type === 'alert' ? 'Alerta Crítico' : 'Insight Comercial'}
                </span>
                {msg.text}
              </p>
            </CardContent>
          </Card>
        ))}
        {insights.length === 0 && (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-xs text-muted-foreground italic">
              Aguardando mais dados para gerar recomendações automáticas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesFunnel;
