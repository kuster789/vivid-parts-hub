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
import { Badge } from "@/components/ui/badge";

interface ProductStat {
  product_id: string;
  name: string;
  brand: string;
  views: number;
  cart_additions: number;
  orders: number;
  conversion_rate: number;
  revenue: number;
  stock: number;
}

interface ProductPerformanceProps {
  products: ProductStat[];
}

const ProductPerformance = ({ products }: ProductPerformanceProps) => {
  if (!products || products.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Performance de Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Produto</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Visualizações</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Carrinho</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Vendas</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Conversão</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Receita</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider">Estoque</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Ação Recomendada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                let action = "Manter";
                let actionColor = "bg-green-500/10 text-green-500";
                
                if (p.views > 20 && p.orders === 0) {
                  action = "Revisar Preço/Fotos";
                  actionColor = "bg-red-500/10 text-red-500";
                } else if (p.stock === 0 && p.views > 10) {
                  action = "Reposição Urgente";
                  actionColor = "bg-amber-500/10 text-amber-500";
                } else if (p.cart_additions > 0 && p.orders === 0) {
                  action = "Verificar Checkout";
                  actionColor = "bg-blue-500/10 text-blue-500";
                }

                return (
                  <TableRow key={p.product_id} className="hover:bg-secondary/20">
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate text-xs font-bold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.brand.toUpperCase()}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">{p.views.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{p.cart_additions.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{p.orders.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right text-xs font-bold text-primary">{p.conversion_rate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-xs font-bold">R$ {p.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-xs font-bold ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-amber-500' : 'text-foreground'}`}>
                        {p.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none text-[9px] font-bold uppercase tracking-tight ${actionColor}`}>
                        {action}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPerformance;
