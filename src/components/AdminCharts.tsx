import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(38, 92%, 50%)", "hsl(200, 70%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(270, 70%, 50%)"];

const AdminCharts = () => {
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Orders by status
      const { data: orders } = await supabase.from("orders").select("status, total, created_at");
      const statusMap: Record<string, number> = {};
      const monthMap: Record<string, number> = {};
      
      (orders || []).forEach((o: any) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        const month = new Date(o.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        monthMap[month] = (monthMap[month] || 0) + Number(o.total);
      });

      setOrdersByStatus(Object.entries(statusMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));
      setRevenueByMonth(Object.entries(monthMap).map(([name, total]) => ({ name, total: Number(total.toFixed(2)) })));

      // Top products by order count
      const { data: items } = await supabase.from("order_items").select("product_id, quantity");
      const productMap: Record<string, number> = {};
      (items || []).forEach((i: any) => {
        productMap[i.product_id] = (productMap[i.product_id] || 0) + i.quantity;
      });
      
      const topIds = Object.entries(productMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (topIds.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, name")
          .in("id", topIds.map(([id]) => id));
        
        setTopProducts(topIds.map(([id, qty]) => ({
          name: (prods || []).find((p: any) => p.id === id)?.name?.slice(0, 20) || id.slice(0, 8),
          vendas: qty,
        })));
      }

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue by month */}
      <div className="card-industrial p-5">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Receita Mensal</h3>
        {revenueByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(210, 15%, 92%)" }}
              />
              <Line type="monotone" dataKey="total" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ fill: "hsl(38, 92%, 50%)" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem dados de receita</p>
        )}
      </div>

      {/* Orders by status */}
      <div className="card-industrial p-5">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Pedidos por Status</h3>
        {ordersByStatus.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={ordersByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {ordersByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem dados de pedidos</p>
        )}
      </div>

      {/* Top products */}
      <div className="card-industrial p-5 lg:col-span-2">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Produtos Mais Vendidos</h3>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 10 }} angle={-15} />
              <YAxis tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="vendas" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem dados de vendas</p>
        )}
      </div>
    </div>
  );
};

export default AdminCharts;
