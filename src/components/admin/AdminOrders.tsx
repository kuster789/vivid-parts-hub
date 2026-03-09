import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Package, Pencil, Save, X, Loader2, ChevronDown, ChevronUp, Truck, MapPin, MessageSquare, Factory, Paintbrush, PackageCheck, Mail, Trash2, AlertTriangle, Ban
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  confirmed: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  shipped: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const productionStages = [
  { key: "producao", label: "Produção", icon: Factory },
  { key: "acabamento", label: "Acabamento", icon: Paintbrush },
  { key: "pintura", label: "Pintura", icon: Paintbrush },
  { key: "embalagem", label: "Embalagem", icon: PackageCheck },
  { key: "postagem", label: "Postagem", icon: Mail },
];

const LOW_STOCK_THRESHOLD = 5;

const AdminOrders = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [trackingEditing, setTrackingEditing] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [customerEmails, setCustomerEmails] = useState<Record<string, string>>({});
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data }, { data: products }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, stock").eq("active", true),
      ]);
      setOrders(data || []);

      // Stock counts
      const prods = products || [];
      setOutOfStockCount(prods.filter((p: any) => p.stock === 0).length);
      setLowStockCount(prods.filter((p: any) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length);

      // Load customer emails from profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((o: any) => o.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);
        if (profiles) {
          const emailMap: Record<string, string> = {};
          profiles.forEach((p: any) => { if (p.email) emailMap[p.user_id] = p.email; });
          setCustomerEmails(emailMap);
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase.from("order_items").select("*, products(name, sku, brand, model, images)").eq("order_id", orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }));
  };

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      await loadOrderItems(orderId);
    }
  };

  const updateStatus = async (id: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    const currentOrder = orders.find((o) => o.id === id);
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));

    // Send email notification for status change
    if (currentOrder) {
      supabase.functions.invoke("send-production-email", {
        body: {
          order_id: id,
          order_status: status,
          tracking_code: currentOrder.tracking_code,
          user_id: currentOrder.user_id,
        },
      }).then(({ error }) => {
        if (error) console.error("Email send error:", error);
      });
    }
  };

  const updateProductionStage = async (id: string, stage: string) => {
    const currentOrder = orders.find((o) => o.id === id);
    const newStage = currentOrder?.production_stage === stage ? null : stage;
    await supabase.from("orders").update({ production_stage: newStage } as any).eq("id", id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, production_stage: newStage } : o)));

    // Send email notification if stage is set (not cleared)
    if (newStage && currentOrder) {
      supabase.functions.invoke("send-production-email", {
        body: {
          order_id: id,
          production_stage: newStage,
          tracking_code: currentOrder.tracking_code,
          user_id: currentOrder.user_id,
        },
      }).then(({ error }) => {
        if (error) console.error("Email send error:", error);
      });
    }
  };

  const saveTracking = async (id: string) => {
    await supabase.from("orders").update({ tracking_code: trackingCode }).eq("id", id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, tracking_code: trackingCode } : o)));
    setTrackingEditing(null);
    setTrackingCode("");
  };

  const deleteOrder = async () => {
    if (!deleteOrderId) return;
    setDeleting(true);
    await supabase.from("order_items").delete().eq("order_id", deleteOrderId);
    await supabase.from("orders").delete().eq("id", deleteOrderId);
    setOrders(orders.filter((o) => o.id !== deleteOrderId));
    if (expandedOrder === deleteOrderId) setExpandedOrder(null);
    setDeleteOrderId(null);
    setDeleting(false);
  };

  const filteredOrders = orders.filter((o) => !statusFilter || o.status === statusFilter);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Status filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("")}
          className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${!statusFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
          Todos ({orders.length})
        </button>
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = orders.filter((o) => o.status === key).length;
          if (count === 0) return null;
          return (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${statusFilter === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}

      <div className="space-y-3">
        {filteredOrders.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-border/80">
            {/* Header */}
            <button onClick={() => toggleExpand(o.id)} className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-secondary/20">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-foreground">#{o.id.slice(0, 8)}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColors[o.status]}`}>
                    {statusLabels[o.status]}
                  </span>
                  {o.production_stage && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {productionStages.find(s => s.key === o.production_stage)?.label || o.production_stage}
                    </span>
                  )}
                  {o.tracking_code && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Truck className="h-3 w-3" /> {o.tracking_code}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{o.shipping_name || "Sem nome"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {customerEmails[o.user_id] && <span className="text-primary">{customerEmails[o.user_id]}</span>}
                  {customerEmails[o.user_id] && (o.shipping_city || o.shipping_phone) && " · "}
                  {o.shipping_city && `${o.shipping_city}, ${o.shipping_state}`}
                  {o.shipping_phone && ` · ${o.shipping_phone}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-lg font-bold text-primary">R$ {Number(o.total).toFixed(2).replace(".", ",")}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
              {expandedOrder === o.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteOrderId(o.id); }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                  title="Excluir pedido"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </button>

            {/* Expanded */}
            {expandedOrder === o.id && (
              <div className="border-t border-border bg-secondary/10 p-5 space-y-5">
                {/* Items */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-3 w-3" /> Itens do Pedido
                  </h4>
                  <div className="space-y-1.5">
                    {(orderItems[o.id] || []).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-lg bg-card p-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {item.products?.images?.[0] ? (
                            <img src={item.products.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.products?.name || "Produto"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.products?.brand?.toUpperCase()} · {item.products?.model}
                            {item.variations?.Cor && <span className="ml-1 text-primary">· Cor: {item.variations.Cor}</span>}
                          </p>
                        </div>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">x{item.quantity}</span>
                        <span className="text-xs font-bold text-foreground">R$ {Number(item.unit_price * item.quantity).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                    {!orderItems[o.id] && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
                  </div>
                </div>

                {/* Production Stage */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Factory className="h-3 w-3" /> Processo de Produção
                  </h4>
                  <div className="flex items-center gap-1">
                    {productionStages.map((stage, i) => {
                      const currentIdx = productionStages.findIndex(s => s.key === o.production_stage);
                      const isActive = o.production_stage === stage.key;
                      const isPast = currentIdx >= 0 && i < currentIdx;
                      const StageIcon = stage.icon;
                      return (
                        <div key={stage.key} className="flex flex-1 items-center">
                          <button
                            onClick={() => updateProductionStage(o.id, stage.key)}
                            title={stage.label}
                            className={`flex flex-col items-center gap-1 rounded-lg border p-2 w-full transition-all ${
                              isActive
                                ? "border-primary bg-primary/20 text-primary"
                                : isPast
                                ? "border-primary/40 bg-primary/5 text-primary/60"
                                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                            }`}
                          >
                            <StageIcon className="h-4 w-4" />
                            <span className="text-[8px] font-semibold uppercase tracking-wider leading-tight text-center">{stage.label}</span>
                          </button>
                          {i < productionStages.length - 1 && (
                            <div className={`h-0.5 w-1 shrink-0 ${isPast || isActive ? "bg-primary/40" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[9px] text-muted-foreground">
                    Clique para atualizar a etapa. O cliente será notificado automaticamente.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Tracking */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Truck className="h-3 w-3" /> Rastreio
                    </h4>
                    {trackingEditing === o.id ? (
                      <div className="flex gap-2">
                        <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: BR123456789BR"
                          className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                        <button onClick={() => saveTracking(o.id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"><Save className="h-4 w-4" /></button>
                        <button onClick={() => setTrackingEditing(null)} className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{o.tracking_code || "Sem rastreio"}</span>
                        <button onClick={() => { setTrackingEditing(o.id); setTrackingCode(o.tracking_code || ""); }}
                          className="rounded-lg p-1 text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {o.shipping_address && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <MapPin className="h-3 w-3" /> Endereço
                      </h4>
                      <p className="text-xs text-foreground">{o.shipping_address}</p>
                      <p className="text-xs text-muted-foreground">{o.shipping_city}, {o.shipping_state} - {o.shipping_zip}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {o.notes && (
                  <div>
                    <h4 className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <MessageSquare className="h-3 w-3" /> Observações
                    </h4>
                    <p className="text-xs text-foreground">{o.notes}</p>
                  </div>
                )}

                {/* Status buttons */}
                <div>
                  <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alterar Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
                      <button key={s} onClick={() => updateStatus(o.id, s)}
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          o.status === s ? statusColors[s] : "border-border text-muted-foreground hover:text-foreground"
                        }`}>
                        {statusLabels[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteOrderId} onOpenChange={(open) => { if (!open) setDeleteOrderId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O pedido e todos os seus itens serão permanentemente excluídos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrder}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrders;
