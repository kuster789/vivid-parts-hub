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
import { Warehouse, AlertCircle } from "lucide-react";

interface InventoryPriority {
  product_id: string;
  name: string;
  stock: number;
  score: number;
  views_30d: number;
  orders_30d: number;
  recommendation: string;
}

interface SmartInventoryProps {
  items: InventoryPriority[];
}

const SmartInventory = ({ items }: SmartInventoryProps) => {
  if (!items || items.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Estoque Inteligente (Prioridade Comercial)
        </CardTitle>
        <Warehouse className="h-4 w-4 text-primary/40" />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Peça / Produto</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Estoque</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Interesse (30d)</TableHead>
                <TableHead className="text-center text-[10px] font-bold uppercase tracking-wider">Prioridade</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Ação Necessária</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 10).map((item) => (
                <TableRow key={item.product_id} className="hover:bg-secondary/20">
                  <TableCell className="text-xs font-bold text-foreground">{item.name}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-xs font-bold ${item.stock === 0 ? 'text-red-500 underline decoration-dotted' : item.stock < 5 ? 'text-amber-500' : 'text-foreground'}`}>
                      {item.stock} un
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium">
                    {item.views_30d} views / {item.orders_30d} vendas
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className={`h-full transition-all ${item.score > 20 ? 'bg-red-500' : item.score > 10 ? 'bg-amber-500' : 'bg-green-500'}`} 
                          style={{ width: `${Math.min(item.score * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-3 w-3 ${item.recommendation.includes('Urgente') ? 'text-red-500 animate-pulse' : 'text-primary/60'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-foreground">
                        {item.recommendation}
                      </span>
                    </div>
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

export default SmartInventory;
