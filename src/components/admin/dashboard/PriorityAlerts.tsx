import { AlertTriangle, Clock, Package } from "lucide-react";

interface OrderRow {
  id: string;
  status: string;
  created_at: string;
  shipping_name: string | null;
  total: number;
}

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  stock: number;
}

interface PriorityAlertsProps {
  orders: OrderRow[];
  outOfStock: ProductRow[];
}

const PriorityAlerts = ({ orders, outOfStock }: PriorityAlertsProps) => {
  const now = Date.now();
  const pendingLong = orders.filter(
    (o) => o.status === "pending" && now - new Date(o.created_at).getTime() > 48 * 60 * 60 * 1000
  );

  if (pendingLong.length === 0 && outOfStock.length === 0) return null;

  return (
    <div className="space-y-2">
      {pendingLong.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 animate-in fade-in duration-300" role="alert">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-500">
              ⏰ {pendingLong.length} pedido(s) pendente(s) há mais de 48h
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pendingLong.slice(0, 5).map((o) => {
                const hours = Math.round((now - new Date(o.created_at).getTime()) / (60 * 60 * 1000));
                return (
                  <span key={o.id} className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    #{o.id.slice(0, 8)} — {o.shipping_name || "Cliente"} · {hours}h atrás
                  </span>
                );
              })}
              {pendingLong.length > 5 && (
                <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  +{pendingLong.length - 5} mais
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {outOfStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 animate-in fade-in duration-300" role="alert">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">
              📦 {outOfStock.length} produto(s) sem estoque
            </p>
            <p className="mt-1 text-xs text-destructive/80">
              {outOfStock.slice(0, 3).map((p) => p.name).join(", ")}
              {outOfStock.length > 3 ? ` e mais ${outOfStock.length - 3}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriorityAlerts;
