import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

interface SearchInsight {
  query: string;
  search_count: number;
  no_results: boolean;
  conversions: number;
}

interface SearchInsightsProps {
  searches: SearchInsight[];
}

const SearchInsights = ({ searches }: SearchInsightsProps) => {
  if (!searches || searches.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Buscas dos Clientes
        </CardTitle>
        <Search className="h-4 w-4 text-primary/40" />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Termo Buscado</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Total de Buscas</TableHead>
                <TableHead className="text-center text-[10px] font-bold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Vendas Geradas</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Ação Recomendada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searches.map((s, i) => (
                <TableRow key={i} className="hover:bg-secondary/20">
                  <TableCell className="text-xs font-bold text-foreground italic">"{s.query}"</TableCell>
                  <TableCell className="text-right text-xs font-medium">{s.search_count.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    {s.no_results ? (
                      <Badge variant="destructive" className="text-[9px] uppercase tracking-tighter">Sem Resultado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-green-500/30 text-green-500">Com Resultado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-primary">{s.conversions || 0}</TableCell>
                  <TableCell>
                    {s.no_results ? (
                      <button className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase text-primary transition-colors hover:bg-primary/20">
                        <Plus className="h-3 w-3" /> Cadastrar Peça
                      </button>
                    ) : (
                      <span className="text-[9px] font-medium text-muted-foreground">Monitorar Estoque</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchInsights;
