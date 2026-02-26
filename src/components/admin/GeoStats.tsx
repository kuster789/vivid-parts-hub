import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface GeoEntry {
  label: string;
  views: number;
}

const GeoStats = () => {
  const [stateData, setStateData] = useState<GeoEntry[]>([]);
  const [cityData, setCityData] = useState<GeoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data } = await supabase
        .from("page_views")
        .select("region, city" as any)
        .gte("created_at", monthStart)
        .not("region" as any, "is", null);

      const stateMap: Record<string, number> = {};
      const cityMap: Record<string, number> = {};

      (data || []).forEach((r: any) => {
        if (r.region) stateMap[r.region] = (stateMap[r.region] || 0) + 1;
        if (r.city) cityMap[r.city] = (cityMap[r.city] || 0) + 1;
      });

      setStateData(
        Object.entries(stateMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([label, views]) => ({ label, views }))
      );

      setCityData(
        Object.entries(cityMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([label, views]) => ({ label, views }))
      );

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (stateData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
            Distribuição Geográfica
          </h3>
        </div>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Dados geográficos serão coletados a partir de agora
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          Distribuição Geográfica (Este Mês)
        </h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* States chart */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Por Estado</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stateData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
              <XAxis type="number" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 10 }} allowDecimals={false} />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 12%, 16%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} visitas`, "Visitas"]}
              />
              <Bar dataKey="views" fill="hsl(38, 92%, 50%)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cities list */}
        <div className="rounded-lg border border-border p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Top Cidades</p>
          <div className="space-y-2">
            {cityData.map((item) => {
              const maxViews = cityData[0]?.views || 1;
              const pct = Math.round((item.views / maxViews) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.views}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoStats;
