import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package, Truck, CheckCircle, Clock, XCircle, Loader2, Search, Factory, Paintbrush, PackageCheck, Mail, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  pending: { icon: Clock, label: "Pendente", color: "text-yellow-500" },
  confirmed: { icon: Package, label: "Confirmado", color: "text-blue-400" },
  shipped: { icon: Truck, label: "Enviado", color: "text-primary" },
  delivered: { icon: CheckCircle, label: "Entregue", color: "text-green-500" },
  cancelled: { icon: XCircle, label: "Cancelado", color: "text-destructive" },
};

const productionStages = [
  { key: "producao", label: "Produção", icon: Factory },
  { key: "acabamento", label: "Acabamento", icon: Paintbrush },
  { key: "pintura", label: "Pintura", icon: Paintbrush },
  { key: "embalagem", label: "Embalagem", icon: PackageCheck },
  { key: "postagem", label: "Postagem", icon: Mail },
];

const statusOrder = ["pending", "confirmed", "shipped", "delivered"];

const Tracking = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("busca") || "");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images, sku))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <Truck className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Você ainda não possui pedidos. Faça login para rastrear.</p>
        <Link to="/login" className="btn-primary-glow rounded-md px-6 py-3 text-sm">Entrar</Link>
      </main>
    );
  }

  const filtered = orders.filter((o) =>
    !search || o.id.includes(search) || o.tracking_code?.includes(search)
  );

  return (
    <main className="py-8">
      <div className="container max-w-3xl">
        <h1 className="section-title mb-6">Rastrear Pedidos</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID ou código de rastreio..."
            className="w-full rounded-md border border-border bg-secondary pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.pending;
              const Icon = cfg.icon;
              const currentStep = statusOrder.indexOf(order.status);

              return (
                <div key={order.id} className="card-industrial p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Pedido</p>
                      <p className="font-mono text-sm font-medium text-foreground">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                      <p className="font-display text-sm font-bold text-primary">
                        R$ {Number(order.total).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {order.status !== "cancelled" && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        {statusOrder.map((s, i) => {
                          const sCfg = statusConfig[s];
                          const SIcon = sCfg.icon;
                          const active = i <= currentStep;
                          return (
                            <div key={s} className="flex flex-1 items-center">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                active ? "border-primary bg-primary/20" : "border-border"
                              }`}>
                                <SIcon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground/40"}`} />
                              </div>
                              {i < statusOrder.length - 1 && (
                                <div className={`mx-1 h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1 flex justify-between">
                        {statusOrder.map((s) => (
                          <span key={s} className="text-[9px] text-muted-foreground">{statusConfig[s].label}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Production stages */}
                  {order.production_stage && (
                    <div className="mb-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Processo de Produção</p>
                      <div className="flex items-center gap-1">
                        {productionStages.map((stage, i) => {
                          const currentIdx = productionStages.findIndex(s => s.key === order.production_stage);
                          const isActive = order.production_stage === stage.key;
                          const isPast = i < currentIdx;
                          const StageIcon = stage.icon;
                          return (
                            <div key={stage.key} className="flex flex-1 items-center">
                              <div className={`flex flex-col items-center gap-0.5 rounded-lg border p-1.5 w-full ${
                                isActive ? "border-primary bg-primary/20" : isPast ? "border-primary/30 bg-primary/5" : "border-border"
                              }`}>
                                <StageIcon className={`h-3 w-3 ${isActive ? "text-primary" : isPast ? "text-primary/50" : "text-muted-foreground/30"}`} />
                                <span className={`text-[7px] font-semibold uppercase leading-tight text-center ${isActive ? "text-primary" : isPast ? "text-primary/50" : "text-muted-foreground/40"}`}>{stage.label}</span>
                              </div>
                              {i < productionStages.length - 1 && (
                                <div className={`h-0.5 w-1 shrink-0 ${isPast || isActive ? "bg-primary/30" : "bg-border"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Customer / shipping details */}
                  {order.shipping_name && (
                    <div className="mb-4 rounded-md border border-border bg-secondary/50 p-3 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Detalhes do Pedido</p>
                      <p className="text-xs text-foreground"><span className="text-muted-foreground">Nome:</span> {order.shipping_name}</p>
                      {order.shipping_phone && <p className="text-xs text-foreground"><span className="text-muted-foreground">Telefone:</span> {order.shipping_phone}</p>}
                      {order.shipping_address && (
                        <p className="text-xs text-foreground">
                          <span className="text-muted-foreground">Endereço:</span> {order.shipping_address}
                          {order.shipping_city && `, ${order.shipping_city}`}
                          {order.shipping_state && ` - ${order.shipping_state}`}
                          {order.shipping_zip && ` | CEP: ${order.shipping_zip}`}
                        </p>
                      )}
                      {order.notes && <p className="text-xs text-foreground"><span className="text-muted-foreground">Obs:</span> {order.notes}</p>}
                    </div>
                  )}

                  {/* Order items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mb-4 rounded-md border border-border bg-secondary/50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" /> Itens do Pedido
                      </p>
                      <div className="space-y-2">
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            {item.products?.images?.[0] && (
                              <img
                                src={item.products.images[0]}
                                alt={item.products?.name || "Produto"}
                                className="h-10 w-10 rounded border border-border object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{item.products?.name || "Produto"}</p>
                              {item.products?.sku && <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.products.sku}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">{item.quantity}x</p>
                              <p className="text-xs font-semibold text-primary">R$ {Number(item.unit_price).toFixed(2).replace(".", ",")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                      <Icon className="h-3.5 w-3.5" /> {cfg.label}
                    </span>
                    {order.tracking_code && (
                      <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold text-primary">
                        {order.tracking_code}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Tracking;
