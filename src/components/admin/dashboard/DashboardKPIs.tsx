import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";

export interface KPICard {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend: string;
  up: boolean | null;
  sparkline?: number[];
}

interface DashboardKPIsProps {
  cards: KPICard[];
}

const DashboardKPIs = ({ cards }: DashboardKPIsProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {cards.map(({ label, value, icon: Icon, trend, up, sparkline }) => (
      <div key={label} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-black text-foreground">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>

        {sparkline && sparkline.length > 1 && (
          <div className="mt-2 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline.map((v, i) => ({ i, v }))}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={up === false ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={`${sparkline ? "mt-1" : "mt-3"} flex items-center gap-1 text-xs`}>
          {up !== null && (
            up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />
          )}
          <span className={up !== null ? (up ? "text-success" : "text-destructive") : "text-muted-foreground"}>{trend}</span>
        </div>
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
      </div>
    ))}
  </div>
);

export default DashboardKPIs;
