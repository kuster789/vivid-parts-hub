import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Download, Mail, Eye, Tag, Copy, Check, Sparkles, RefreshCw } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Lead {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
  coupon_code?: string | null;
  session_id?: string | null;
  visit_count?: number;
  pages_visited?: string[];
}

type FilterType = "all" | "returning" | "new";

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [couponDialog, setCouponDialog] = useState<{ open: boolean; code: string; email: string }>({ open: false, code: "", email: "" });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    const sessionIds = [...new Set((data as any[]).map((l) => l.session_id).filter(Boolean))];
    let visitMap: Record<string, { count: number; pages: string[] }> = {};

    if (sessionIds.length > 0) {
      const { data: views } = await (supabase
        .from("page_views")
        .select("session_id, path") as any)
        .in("session_id", sessionIds);

      (views || []).forEach((v: any) => {
        if (!visitMap[v.session_id]) visitMap[v.session_id] = { count: 0, pages: [] };
        visitMap[v.session_id].count++;
        if (!visitMap[v.session_id].pages.includes(v.path)) {
          visitMap[v.session_id].pages.push(v.path);
        }
      });
    }

    const enriched: Lead[] = (data as any[]).map((l) => ({
      ...l,
      visit_count: l.session_id ? (visitMap[l.session_id]?.count || 0) : 0,
      pages_visited: l.session_id ? (visitMap[l.session_id]?.pages || []) : [],
    }));

    setLeads(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Lead removido" });
    }
  };

  const handleGenerateCoupon = async (lead: Lead) => {
    setGeneratingFor(lead.id);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-coupon-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ email: lead.email, lead_id: lead.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar cupom");

      const code = data.coupon_code;
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, coupon_code: code } : l));
      setCouponDialog({ open: true, code, email: lead.email });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLeads = leads.filter((l) => {
    if (filter === "returning") return (l.visit_count || 0) > 2;
    if (filter === "new") return (l.visit_count || 0) <= 2;
    return true;
  });

  const returningCount = leads.filter((l) => (l.visit_count || 0) > 2).length;
  const newCount = leads.filter((l) => (l.visit_count || 0) <= 2).length;

  const handleExportCSV = () => {
    if (!filteredLeads.length) return;
    const header = "Email,Fonte,Data,Visitas,Cupom,Páginas Visitadas\n";
    const rows = filteredLeads.map((l) =>
      `"${l.email}","${l.source || ""}","${new Date(l.created_at).toLocaleDateString("pt-BR")}",${l.visit_count || 0},"${l.coupon_code || ""}","${(l.pages_visited || []).join("; ")}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">{leads.length} lead(s) total</p>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {([
              { key: "all" as FilterType, label: "Todos", count: leads.length },
              { key: "returning" as FilterType, label: "Recorrentes", count: returningCount },
              { key: "new" as FilterType, label: "Novos", count: newCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">{f.count}</span>
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredLeads.length}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Mail className="mb-3 h-10 w-10" />
          <p className="text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Páginas</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cupom 10%</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.email}</TableCell>
                  <TableCell>{lead.source || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{lead.visit_count || 0}</span>
                      {(lead.visit_count || 0) > 2 && (
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                          Recorrente
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(lead.pages_visited || []).slice(0, 3).map((p) => (
                        <span key={p} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {p === "/" ? "Início" : p.replace(/^\//, "")}
                        </span>
                      ))}
                      {(lead.pages_visited || []).length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{(lead.pages_visited || []).length - 3}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(lead.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    {lead.coupon_code ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-primary bg-primary/10 rounded px-2 py-1">
                          {lead.coupon_code}
                        </span>
                        <button
                          onClick={() => handleCopy(lead.coupon_code!)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copiar"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleGenerateCoupon(lead)}
                          disabled={generatingFor === lead.id}
                          className="text-muted-foreground hover:text-foreground"
                          title="Gerar novo cupom e reenviar"
                        >
                          {generatingFor === lead.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCoupon(lead)}
                        disabled={generatingFor === lead.id}
                        className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        {generatingFor === lead.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Tag className="h-3.5 w-3.5" />
                        }
                        Enviar cupom
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Coupon success dialog */}
      <Dialog open={couponDialog.open} onOpenChange={(open) => { if (!open) setCouponDialog(p => ({ ...p, open: false })); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Cupom gerado e enviado!</DialogTitle>
            </div>
            <DialogDescription>
              E-mail enviado para <span className="font-medium text-foreground">{couponDialog.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Código do cupom</p>
            <p className="font-mono text-xl font-bold tracking-wider text-primary">{couponDialog.code}</p>
            <p className="mt-1 text-xs text-muted-foreground">10% de desconto · Uso único · Primeira compra</p>
          </div>

          <Button onClick={() => handleCopy(couponDialog.code)} variant="outline" className="w-full gap-2">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar código"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
