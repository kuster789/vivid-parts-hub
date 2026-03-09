import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Tag, Search, RefreshCw } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  active: boolean;
  discount_percent: number;
  discount_amount: number;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

interface CouponForm {
  code: string;
  discount_type: "percent" | "amount";
  discount_value: string;
  min_order_value: string;
  max_uses: string;
  expires_at: string;
}

const DEFAULT_FORM: CouponForm = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order_value: "",
  max_uses: "",
  expires_at: "",
};

export default function AdminCoupons() {
  const { getModulePerms } = usePermissions();
  const perms = getModulePerms("coupons");

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar cupons");
    } else {
      setCoupons(data as Coupon[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (coupon: Coupon) => {
    if (!perms.can_edit) return;
    setTogglingId(coupon.id);
    const { error } = await supabase
      .from("coupons")
      .update({ active: !coupon.active })
      .eq("id", coupon.id);

    if (error) {
      toast.error("Erro ao atualizar cupom");
    } else {
      setCoupons(prev =>
        prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c)
      );
      toast.success(`Cupom ${!coupon.active ? "ativado" : "desativado"}`);
    }
    setTogglingId(null);
  };

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error("Informe o código do cupom"); return; }
    const val = parseFloat(form.discount_value);
    if (!form.discount_value || isNaN(val) || val <= 0) {
      toast.error("Informe um valor de desconto válido"); return;
    }
    if (form.discount_type === "percent" && val > 100) {
      toast.error("O percentual não pode ser maior que 100%"); return;
    }

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      active: true,
      discount_percent: form.discount_type === "percent" ? val : 0,
      discount_amount: form.discount_type === "amount" ? val : 0,
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    const { error } = await supabase.from("coupons").insert([payload]);
    if (error) {
      if (error.code === "23505") toast.error("Já existe um cupom com esse código");
      else toast.error("Erro ao criar cupom");
    } else {
      toast.success("Cupom criado com sucesso!");
      setCreateOpen(false);
      setForm(DEFAULT_FORM);
      void load();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("coupons").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir cupom");
    } else {
      toast.success("Cupom excluído");
      setCoupons(prev => prev.filter(c => c.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const isExpired = (c: Coupon) =>
    c.expires_at ? isPast(parseISO(c.expires_at)) : false;

  const isExhausted = (c: Coupon) =>
    c.max_uses !== null && c.used_count >= c.max_uses;

  const getStatusBadge = (c: Coupon) => {
    if (!c.active) return <Badge variant="secondary">Inativo</Badge>;
    if (isExpired(c)) return <Badge variant="destructive">Expirado</Badge>;
    if (isExhausted(c)) return <Badge variant="destructive">Esgotado</Badge>;
    return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Ativo</Badge>;
  };

  const getDiscountLabel = (c: Coupon) => {
    if (c.discount_percent > 0) return `${c.discount_percent}%`;
    if (c.discount_amount > 0) return `R$ ${Number(c.discount_amount).toFixed(2)}`;
    return "—";
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cupom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Atualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
        {perms.can_create && (
          <Button onClick={() => { setForm(DEFAULT_FORM); setCreateOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cupom
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: coupons.length, color: "text-foreground" },
          { label: "Ativos", value: coupons.filter(c => c.active && !isExpired(c) && !isExhausted(c)).length, color: "text-green-600" },
          { label: "Inativos", value: coupons.filter(c => !c.active).length, color: "text-muted-foreground" },
          { label: "Expirados/Esgotados", value: coupons.filter(c => isExpired(c) || isExhausted(c)).length, color: "text-destructive" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Tag className="h-10 w-10 opacity-30" />
            <p className="text-sm">{search ? "Nenhum cupom encontrado" : "Nenhum cupom cadastrado"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Pedido mínimo</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                {perms.can_edit && <TableHead>Ativo</TableHead>}
                {perms.can_delete && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(coupon => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-sm tracking-wider text-primary">
                      {coupon.code}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{getDiscountLabel(coupon)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.used_count}
                    {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : " (ilimitado)"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.min_order_value ? `R$ ${Number(coupon.min_order_value).toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.expires_at
                      ? format(parseISO(coupon.expires_at), "dd/MM/yyyy", { locale: ptBR })
                      : "Sem validade"}
                  </TableCell>
                  <TableCell>{getStatusBadge(coupon)}</TableCell>
                  {perms.can_edit && (
                    <TableCell>
                      {togglingId === coupon.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={coupon.active}
                          onCheckedChange={() => handleToggle(coupon)}
                          aria-label={`Toggle ${coupon.code}`}
                        />
                      )}
                    </TableCell>
                  )}
                  {perms.can_delete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => setDeleteTarget(coupon)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Cupom</DialogTitle>
            <DialogDescription>Preencha os campos para criar um novo cupom de desconto.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input
                placeholder="ex: AGRALE10"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de desconto *</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={v => setForm(f => ({ ...f, discount_type: v as "percent" | "amount" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="amount">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  min="0"
                  max={form.discount_type === "percent" ? 100 : undefined}
                  step="0.01"
                  placeholder={form.discount_type === "percent" ? "ex: 10" : "ex: 25.00"}
                  value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Pedido mínimo (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                  value={form.min_order_value}
                  onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Limite de usos</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ilimitado"
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data de expiração</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              O cupom <strong className="text-foreground font-mono">{deleteTarget?.code}</strong> será excluído permanentemente e não poderá mais ser utilizado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
