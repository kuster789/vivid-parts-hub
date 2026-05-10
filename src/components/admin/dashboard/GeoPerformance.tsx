import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Globe, MapPin } from "lucide-react";

interface GeoStat {
  country: string;
  state: string;
  city: string;
  visits: number;
  orders: number;
  revenue: number;
}

interface GeoPerformanceProps {
  data: GeoStat[];
}

const GeoPerformance = ({ data }: GeoPerformanceProps) => {
  const normalizedData = useMemo(() => {
    if (!data) return [];
    
    // The normalization already happens in DB trigger, 
    // but we can group any remaining anomalies here if needed.
    return data.slice(0, 15);
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Distribuição por Estado
          </CardTitle>
          <MapPin className="h-4 w-4 text-primary/40" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Estado</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Visitas</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Vendas</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedData.map((s, i) => (
                  <TableRow key={i} className="hover:bg-secondary/20">
                    <TableCell className="text-xs font-bold text-foreground">{s.state || 'Desconhecido'}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{s.visits.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{s.orders.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-primary">R$ {s.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Top Cidades (Oportunidades)
          </CardTitle>
          <Globe className="h-4 w-4 text-primary/40" />
        </CardHeader>
        <CardContent>
           <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Cidade</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Visitas</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider">Insight Comercial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedData.filter(d => d.city).map((s, i) => {
                  let insight = "Monitorar tráfego";
                  if (s.visits > 10 && s.orders === 0) insight = "Alta intenção, zero venda. Avaliar frete.";
                  if (s.orders > 0) insight = "Região compradora. Focar estoque.";
                  
                  return (
                    <TableRow key={i} className="hover:bg-secondary/20">
                      <TableCell className="text-xs font-bold text-foreground">{s.city}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{s.visits.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground italic">{insight}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeoPerformance;
