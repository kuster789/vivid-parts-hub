import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(38, 92%, 50%)", "hsl(200, 70%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(270, 70%, 50%)"];

const AdminCharts = () => {
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-industrial p-5">
        <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Receita Mensal</h3>
        {revenueByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ fill: "hsl(38, 92%, 50%)" }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem dados de receita</p>
        )}
      </div>

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
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem dados de pedidos</p>
        )}
      </div>
    </div>
  );
};

export default AdminCharts;
