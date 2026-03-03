import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2, Globe, Map, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface GeoEntry {
  label: string;
  views: number;
}

const GeoStats = () => {
  const [countryData, setCountryData] = useState<GeoEntry[]>([]);
  const [stateData, setStateData] = useState<GeoEntry[]>([]);
  const [cityData, setCityData] = useState<GeoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data } = await supabase
        .from("page_views")
        .select("region, city, country" as any)
        .gte("created_at", monthStart)
        .not("country" as any, "is", null);

      const countryMap: Record<string, number> = {};
      const stateMap: Record<string, number> = {};
      const cityMap: Record<string, number> = {};

      (data || []).forEach((r: any) => {
        if (r.country) {
          countryMap[r.country] = (countryMap[r.country] || 0) + 1;
        }
        if (r.region) {
          const isBrazil = r.country === "Brazil" || r.country === "Brasil";
          const stateLabel = isBrazil ? r.region : `${r.region} (${r.country})`;
          stateMap[stateLabel] = (stateMap[stateLabel] || 0) + 1;
        }
        if (r.city) {
          const isBrazil = r.country === "Brazil" || r.country === "Brasil";
          const cityLabel = isBrazil ? r.city : `${r.city} (${r.country})`;
          cityMap[cityLabel] = (cityMap[cityLabel] || 0) + 1;
        }
      });

      const toSorted = (map: Record<string, number>, limit = 15) =>
        Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([label, views]) => ({ label, views }));

      setCountryData(toSorted(countryMap, 10));
      setStateData(toSorted(stateMap, 12));
      setCityData(toSorted(cityMap, 12));
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

  if (countryData.length === 0 && stateData.length === 0) {
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

  const ChartBlock = ({ data, color }: { data: GeoEntry[]; color: string }) => (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
        <XAxis type="number" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 10 }} allowDecimals={false} />
        <YAxis dataKey="label" type="category" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} width={140} />
        <Tooltip
          contentStyle={{
            background: "hsl(220, 18%, 10%)",
            border: "1px solid hsl(220, 12%, 16%)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value} visitas`, "Visitas"]}
        />
        <Bar dataKey="views" fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const BarList = ({ data }: { data: GeoEntry[] }) => {
    const max = data[0]?.views || 1;
    return (
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.views}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.round((item.views / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          Distribuição Geográfica (Este Mês)
        </h3>
      </div>

      <Tabs defaultValue="country" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="country" className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" /> País
          </TabsTrigger>
          <TabsTrigger value="state" className="flex items-center gap-1.5 text-xs">
            <Map className="h-3.5 w-3.5" /> Estado
          </TabsTrigger>
          <TabsTrigger value="city" className="flex items-center gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" /> Cidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="country" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Visitas por País</p>
              <ChartBlock data={countryData} color="hsl(38, 92%, 50%)" />
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Ranking de Países</p>
              <BarList data={countryData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="state" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Visitas por Estado/Região</p>
              <ChartBlock data={stateData} color="hsl(200, 80%, 50%)" />
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Top Estados</p>
              <BarList data={stateData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="city" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Visitas por Cidade</p>
              <ChartBlock data={cityData} color="hsl(150, 70%, 45%)" />
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Top Cidades</p>
              <BarList data={cityData} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeoStats;
