import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, TrendingUp, Globe, Loader2, Clock, Link2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const VisitorStats = () => {
  const [online, setOnline] = useState(0);
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState(0);
  const [month, setMonth] = useState(0);
  const [topPages, setTopPages] = useState<{ path: string; views: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; views: number }[]>([]);
  const [utmData, setUtmData] = useState<{ source: string; views: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const load = async () => {
      const [
        { count: todayCount },
        { count: weekCount },
        { count: monthCount },
        { data: recentSessions },
        { data: allToday },
      ] = await Promise.all([
        supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("page_views").select("session_id").gte("created_at", onlineThreshold),
        supabase.from("page_views").select("path, created_at, utm_source" as any).gte("created_at", todayStart),
      ]);

      setToday(todayCount || 0);
      setWeek(weekCount || 0);
      setMonth(monthCount || 0);

      const uniqueSessions = new Set((recentSessions || []).map((r: any) => r.session_id));
      setOnline(uniqueSessions.size);

      // Top pages
      const pageMap: Record<string, number> = {};
      const hourMap: Record<number, number> = {};
      const sourceMap: Record<string, number> = {};

      (allToday || []).forEach((r: any) => {
        pageMap[r.path] = (pageMap[r.path] || 0) + 1;

        const hour = new Date(r.created_at).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;

        const src = r.utm_source || "Direto";
        sourceMap[src] = (sourceMap[src] || 0) + 1;
      });

      setTopPages(
        Object.entries(pageMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([path, views]) => ({ path, views }))
      );

      // Fill all 24 hours
      const hourly = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, "0")}h`,
        views: hourMap[i] || 0,
      }));
      setHourlyData(hourly);

      setUtmData(
        Object.entries(sourceMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([source, views]) => ({ source, views }))
      );

      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("page_views_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "page_views" },
        () => {
          supabase
            .from("page_views")
            .select("session_id")
            .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .then(({ data }) => {
              const unique = new Set((data || []).map((r: any) => r.session_id));
              setOnline(unique.size);
              setToday((prev) => prev + 1);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Online Agora", value: online, icon: Globe, color: "text-green-500", bg: "bg-green-500/10", pulse: true },
    { label: "Hoje", value: today, icon: Eye, color: "text-primary", bg: "bg-primary/10" },
    { label: "Últimos 7 dias", value: week, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Este Mês", value: month, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  const pathLabels: Record<string, string> = {
    "/": "Início",
    "/catalogo": "Catálogo",
    "/blog": "Blog",
    "/carrinho": "Carrinho",
    "/manuais": "Manuais",
    "/favoritos": "Favoritos",
    "/suporte": "Suporte",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          Visitantes do Site
        </h3>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-[10px] text-green-500 font-medium">Tempo real</span>
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, bg, pulse }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className={`font-display text-lg font-bold ${color}`}>
                {value}
                {pulse && (
                  <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hourly chart + UTM sources */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hourly chart */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Visitantes por Hora (Hoje)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 10 }}
                interval={2}
              />
              <YAxis tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 12%, 16%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} visitas`, "Visitas"]}
              />
              <Bar dataKey="views" fill="hsl(38, 92%, 50%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* UTM Sources */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origem do Tráfego (Hoje)</p>
          </div>
          {utmData.length > 0 ? (
            <div className="space-y-2">
              {utmData.map((item) => {
                const maxViews = utmData[0]?.views || 1;
                const pct = Math.round((item.views / maxViews) * 100);
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">{item.source}</span>
                      <span className="text-muted-foreground">{item.views} visitas</span>
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
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados de origem</p>
          )}
        </div>
      </div>

      {/* Top pages */}
      {topPages.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border">
          <div className="px-4 py-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Páginas Mais Visitadas Hoje</p>
          </div>
          {topPages.map((p) => (
            <div key={p.path} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-foreground">{pathLabels[p.path] || p.path}</span>
              <span className="font-display text-sm font-bold text-primary">{p.views} visitas</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorStats;
