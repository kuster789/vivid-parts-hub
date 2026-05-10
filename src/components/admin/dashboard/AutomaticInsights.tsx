import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertCircle, ShoppingCart, Search, Globe } from "lucide-react";

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: string;
  icon: any;
}

interface AutomaticInsightsProps {
  insights: Insight[];
}

const AutomaticInsights = ({ insights }: AutomaticInsightsProps) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          Inteligência Comercial — Sugestões do Dia
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => (
          <Card key={insight.id} className="group overflow-hidden border-border/50 bg-card/50 transition-all hover:border-primary/40 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                insight.type === 'critical' ? 'bg-red-500/10 text-red-500' :
                insight.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                insight.type === 'success' ? 'bg-green-500/10 text-green-500' :
                'bg-blue-500/10 text-blue-500'
              }`}>
                <insight.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-foreground">
                  {insight.title}
                </CardTitle>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                  Impacto: {insight.impact}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                {insight.description}
              </p>
              <button className="w-full rounded-md border border-border bg-secondary/50 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                {insight.action}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AutomaticInsights;
