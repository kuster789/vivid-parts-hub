import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Loader2, TrendingUp, DollarSign, Percent, Package } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface Sale {
  id: string;
  order_date: string;
  product_name: string;
  piece_value: number;
  platform_cost: number;
  shipping_cost: number;
  manufacturing_cost: number;
  net_value: number;
  profit_percentage: number;
  notes: string | null;
  created_at: string;
}

const COLORS = ["hsl(38, 92%, 50%)", "hsl(200, 70%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(270, 70%, 50%)"];

const AdminSales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [productName, setProductName] = useState("");
  const [pieceValue, setPieceValue] = useState("");
  const [platformCost, setPlatformCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [manufacturingCost, setManufacturingCost] = useState("");
  const [notes, setNotes] = useState("");

  const loadSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("order_date", { ascending: false });
    if (!error && data) setSales(data as Sale[]);
    setLoading(false);
  };

  useEffect(() => { loadSales(); }, []);

  // Computed preview values
  const previewNet = useMemo(() => {
    const pv = Number(pieceValue) || 0;
    const pc = Number(platformCost) || 0;
    const sc = Number(shippingCost) || 0;
    const mc = Number(manufacturingCost) || 0;
    return pv - pc - sc - mc;
  }, [pieceValue, platformCost, shippingCost, manufacturingCost]);

  const previewPercent = useMemo(() => {
    const pv = Number(pieceValue) || 0;
    return pv > 0 ? ((previewNet / pv) * 100).toFixed(2) : "0";
  }, [previewNet, pieceValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !pieceValue) {
      toast.error("Preencha o nome do produto e valor da peça.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("sales").insert({
      order_date: format(orderDate, "yyyy-MM-dd"),
      product_name: productName.trim(),
      piece_value: Number(pieceValue),
      platform_cost: Number(platformCost) || 0,
      shipping_cost: Number(shippingCost) || 0,
      manufacturing_cost: Number(manufacturingCost) || 0,
      notes: notes.trim() || null,
      created_by: user?.id,
    } as any);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar venda: " + error.message);
    } else {
      toast.success("Venda registrada com sucesso!");
      setDialogOpen(false);
      resetForm();
      loadSales();
    }
  };

  const resetForm = () => {
    setOrderDate(new Date());
    setProductName("");
    setPieceValue("");
    setPlatformCost("");
    setShippingCost("");
    setManufacturingCost("");
    setNotes("");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Venda excluída"); loadSales(); }
  };

  // Chart data
  const revenueByMonth = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number }> = {};
    sales.forEach(s => {
      const key = format(new Date(s.order_date), "MMM/yy", { locale: ptBR });
      if (!map[key]) map[key] = { revenue: 0, profit: 0 };
      map[key].revenue += s.piece_value;
      map[key].profit += s.net_value;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v }));
  }, [sales]);

  const costBreakdown = useMemo(() => {
    const totals = { platform: 0, shipping: 0, manufacturing: 0, profit: 0 };
    sales.forEach(s => {
      totals.platform += s.platform_cost;
      totals.shipping += s.shipping_cost;
      totals.manufacturing += s.manufacturing_cost;
      totals.profit += s.net_value;
    });
    return [
      { name: "Plataforma", value: totals.platform },
      { name: "Frete", value: totals.shipping },
      { name: "Fabricação", value: totals.manufacturing },
      { name: "Lucro", value: totals.profit },
    ].filter(d => d.value > 0);
  }, [sales]);

  // Summary
  const summary = useMemo(() => {
    const totalRevenue = sales.reduce((a, s) => a + s.piece_value, 0);
    const totalProfit = sales.reduce((a, s) => a + s.net_value, 0);
    const avgMargin = sales.length > 0 ? sales.reduce((a, s) => a + s.profit_percentage, 0) / sales.length : 0;
    return { totalRevenue, totalProfit, avgMargin, count: sales.length };
  }, [sales]);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Vendas", value: summary.count, icon: Package, color: "text-blue-400" },
          { label: "Receita Bruta", value: `R$ ${summary.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
          { label: "Lucro Líquido", value: `R$ ${summary.totalProfit.toFixed(2)}`, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Margem Média", value: `${summary.avgMargin.toFixed(1)}%`, icon: Percent, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-industrial flex items-center gap-4 p-4">
            <Icon className={cn("h-8 w-8", color)} />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-industrial p-5">
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Receita vs Lucro Mensal</h3>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 16%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215, 10%, 55%)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" name="Receita" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Lucro" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">Sem dados ainda</p>}
        </div>

        <div className="card-industrial p-5">
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Distribuição de Custos</h3>
          {costBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={costBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: R$${value.toFixed(0)}`}>
                  {costBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 12%, 16%)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">Sem dados ainda</p>}
        </div>
      </div>

      {/* Add sale button + table */}
      <div className="card-industrial p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Vendas Registradas</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nova Venda</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Venda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Data do Pedido</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !orderDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {orderDate ? format(orderDate, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={orderDate} onSelect={(d) => d && setOrderDate(d)} locale={ptBR} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nome do Produto</Label>
                    <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ex: Grade Farol Agrale" required />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Valor da Peça (R$)</Label>
                    <Input type="number" step="0.01" min="0" value={pieceValue} onChange={e => setPieceValue(e.target.value)} placeholder="480.00" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Custos da Plataforma (R$)</Label>
                    <Input type="number" step="0.01" min="0" value={platformCost} onChange={e => setPlatformCost(e.target.value)} placeholder="81.60" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Custo de Frete (R$)</Label>
                    <Input type="number" step="0.01" min="0" value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder="49.90" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Custo de Fabricação (R$)</Label>
                    <Input type="number" step="0.01" min="0" value={manufacturingCost} onChange={e => setManufacturingCost(e.target.value)} placeholder="100.00" />
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor Líquido:</span>
                    <span className={cn("font-bold", previewNet >= 0 ? "text-emerald-400" : "text-destructive")}>
                      R$ {previewNet.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Margem:</span>
                    <span className={cn("font-bold", Number(previewPercent) >= 0 ? "text-amber-400" : "text-destructive")}>
                      {previewPercent}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Observações</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Venda via Mercado Livre" rows={2} />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Registrar Venda
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-4">Data</th>
                <th className="pb-2 pr-4">Produto</th>
                <th className="pb-2 pr-4 text-right">Valor</th>
                <th className="pb-2 pr-4 text-right">Plataforma</th>
                <th className="pb-2 pr-4 text-right">Frete</th>
                <th className="pb-2 pr-4 text-right">Fabricação</th>
                <th className="pb-2 pr-4 text-right">Líquido</th>
                <th className="pb-2 pr-4 text-right">Margem</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 whitespace-nowrap">{format(new Date(s.order_date), "dd/MM/yy")}</td>
                  <td className="py-2 pr-4 max-w-[150px] truncate">{s.product_name}</td>
                  <td className="py-2 pr-4 text-right">R$ {s.piece_value.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right text-red-400">-R$ {s.platform_cost.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right text-red-400">-R$ {s.shipping_cost.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-right text-red-400">-R$ {s.manufacturing_cost.toFixed(2)}</td>
                  <td className={cn("py-2 pr-4 text-right font-bold", s.net_value >= 0 ? "text-emerald-400" : "text-destructive")}>
                    R$ {s.net_value.toFixed(2)}
                  </td>
                  <td className={cn("py-2 pr-4 text-right font-bold", s.profit_percentage >= 0 ? "text-amber-400" : "text-destructive")}>
                    {s.profit_percentage.toFixed(1)}%
                  </td>
                  <td className="py-2">
                    <button onClick={() => handleDelete(s.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Nenhuma venda registrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSales;
