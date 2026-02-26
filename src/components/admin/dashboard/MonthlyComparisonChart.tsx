import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MonthlyComparisonChartProps {
  data: Array<{ name: string; site: number; externo: number }>;
}

const MonthlyComparisonChart = ({ data }: MonthlyComparisonChartProps) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">
      Receita Mensal — Site vs Vendas Externas
    </h3>
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
          />
          <Legend />
          <Bar dataKey="site" name="Site" fill="hsl(200, 70%, 50%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="externo" name="Externo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <p className="py-10 text-center text-sm text-muted-foreground">Sem dados de vendas para comparar</p>
    )}
  </div>
);

export default MonthlyComparisonChart;
