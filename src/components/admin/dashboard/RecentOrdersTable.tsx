interface Order {
  id: string;
  shipping_name: string | null;
  created_at: string;
  status: string;
  total: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  confirmed: "bg-blue-400/10 text-blue-400",
  shipped: "bg-purple-400/10 text-purple-400",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

interface RecentOrdersTableProps {
  orders: Order[];
}

const RecentOrdersTable = ({ orders }: RecentOrdersTableProps) => (
  <div className="rounded-xl border border-border bg-card">
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Pedidos Recentes</h3>
      <span className="text-[10px] text-muted-foreground">Últimos 5</span>
    </div>
    <div className="divide-y divide-border">
      {orders.map((o) => (
        <div key={o.id} className="flex items-center gap-4 px-5 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{o.shipping_name || "Cliente"}</p>
            <p className="text-[10px] text-muted-foreground">
              #{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[o.status] || ""}`}>
            {statusLabels[o.status] || o.status}
          </span>
          <span className="font-display text-sm font-bold text-primary">
            R$ {Number(o.total).toFixed(2).replace(".", ",")}
          </span>
        </div>
      ))}
      {orders.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum pedido recente</p>
      )}
    </div>
  </div>
);

export default RecentOrdersTable;
