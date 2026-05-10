import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, AlertTriangle, Lightbulb, CheckCircle2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Step {
  name: string;
  count: number;
  benchmark_rate?: number;
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
      const benchmark = funnelData[checkoutIdx].benchmark_rate || 45;
      if (conversion && conversion < benchmark) {
        messages.push({
          type: 'alert',
          text: `Atenção: A conversão Carrinho -> Checkout (${conversion.toFixed(1)}%) está abaixo do benchmark (${benchmark}%). Verificar frete, prazo ou fluxos de login.`
        });
      }
    }

    // Check for dropoff between checkout and order
    const checkoutStep = funnelData.find(s => s.name.toLowerCase().includes("checkout"));
    const orderIdx = funnelData.findIndex(s => s.name.toLowerCase().includes("compra") || s.name.toLowerCase().includes("pedido"));
    if (checkoutStep && orderIdx !== -1) {
      const conversion = checkoutStep.conversion;
      const benchmark = funnelData[orderIdx].benchmark_rate || 50;
      if (conversion && conversion < benchmark) {
        messages.push({
          type: 'insight',
          text: `Gargalo no Checkout: Apenas ${conversion.toFixed(1)}% dos checkouts viram compra. Benchmark: ${benchmark}%. Avalie simplificar o formulário.`
        });
      }
    }

    return messages;
  }, [funnelData]);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 border-border/50 bg-card/50 overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/50 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
              Funil de Conversão Comercial
            </CardTitle>
            <div className="flex items-center gap-2">
               <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[10px]">
                    Benchmarks sugeridos: <br/>
                    - Carrinho: 7-8% das visitas <br/>
                    - Checkout: 45-50% do carrinho <br/>
                    - Venda: 50-55% do checkout
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="space-y-6">
            {funnelData.map((step, i) => (
              <div key={i} className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-40 shrink-0">
                    <div className="text-xs font-bold uppercase tracking-tight text-foreground">{step.name}</div>
                    {step.benchmark_rate && i > 0 && (
                      <div className="text-[10px] text-muted-foreground font-medium">Benchmark: {step.benchmark_rate}%</div>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <div className="h-12 w-full rounded-lg bg-secondary/30 overflow-hidden border border-border/30">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          i === 0 ? "bg-primary/40" : 
                          i === 1 ? "bg-primary/30" :
                          i === 2 ? "bg-primary/20" : "bg-primary/10"
                        }`} 
                        style={{ width: `${(step.count / (funnelData[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
                          {step.count.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">eventos</span>
                      </span>
                      {i === 0 ? (
                        <span className="text-[10px] uppercase tracking-widest text-primary/70">Base 100%</span>
                      ) : (
                        <span className="flex items-center gap-1">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                             (step.count / (funnelData[0]?.count || 1)) * 100 >= (step.benchmark_rate || 0) / (i * 2) 
                             ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"
                           }`}>
                            {((step.count / (funnelData[0]?.count || 1)) * 100).toFixed(1)}% do total
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {step.conversion !== null && (
                  <div className="ml-[10rem] flex items-center gap-3 py-3">
                    <ArrowRight className="h-3 w-3 text-primary/40 rotate-90" />
                    <div className="flex items-center gap-4 border-l-2 border-primary/10 pl-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Conversão</span>
                        <span className={`text-sm font-black ${
                          step.conversion >= (funnelData[i+1]?.benchmark_rate || 40) ? "text-success" : "text-primary"
                        }`}>
                          {step.conversion.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Perda (Churn)</span>
                        <span className="text-sm font-black text-red-500/80">
                          {step.dropoff?.toFixed(1)}%
                        </span>
                      </div>
                      {funnelData[i+1]?.benchmark_rate && (
                         <div className="flex flex-col border-l border-border pl-4">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Status</span>
                          {step.conversion >= (funnelData[i+1]?.benchmark_rate || 40) ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-success uppercase">
                              <CheckCircle2 className="h-3 w-3" /> Saudável
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 uppercase">
                              <AlertTriangle className="h-3 w-3" /> Abaixo Meta
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {insights.map((msg, i) => (
          <Card key={i} className={`border-l-4 ${msg.type === 'alert' ? 'border-l-red-500' : 'border-l-primary'} border-border/50 bg-card/50 shadow-sm`}>
            <CardContent className="flex gap-3 p-4">
              {msg.type === 'alert' ? 
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" /> : 
                <Lightbulb className="h-5 w-5 shrink-0 text-primary" />
              }
              <div className="space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-widest block ${msg.type === 'alert' ? 'text-red-500' : 'text-primary'}`}>
                  {msg.type === 'alert' ? 'Gargalo Crítico' : 'Oportunidade'}
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                  {msg.text}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {insights.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-card/20">
            <CheckCircle2 className="h-8 w-8 text-success/30 mb-3" />
            <p className="text-xs text-muted-foreground italic">
              Fluxo de conversão saudável. Continue monitorando os benchmarks.
            </p>
          </div>
        )}
        
        <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Meta Agrale</h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Mantenha o checkout acima de 50% de conversão para garantir o ROI das campanhas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;