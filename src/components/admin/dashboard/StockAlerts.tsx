import { AlertTriangle } from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  stock: number;
}

interface StockAlertsProps {
  outOfStock: ProductRow[];
  lowStock: ProductRow[];
  onEdit: (product: ProductRow) => void;
}

const StockAlerts = ({ outOfStock, lowStock, onEdit }: StockAlertsProps) => {
  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="space-y-3">
      {outOfStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">Sem Estoque — {outOfStock.length} produto(s)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {outOfStock.slice(0, 8).map((p) => (
                <button key={p.id} onClick={() => onEdit(p)} className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/25 transition-colors cursor-pointer" aria-label={`Editar estoque de ${p.name}`}>
                  {p.name} <span className="opacity-60">({p.brand.toUpperCase()})</span>
                </button>
              ))}
              {outOfStock.length > 8 && (
                <span className="rounded-md bg-destructive/15 px-2 py-1 text-[11px] font-medium text-destructive">
                  +{outOfStock.length - 8} mais
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4" role="alert">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-500">Estoque Baixo (&lt;5 un.) — {lowStock.length} produto(s)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStock.slice(0, 8).map((p) => (
                <button key={p.id} onClick={() => onEdit(p)} className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer" aria-label={`Editar estoque de ${p.name}`}>
                  {p.name} <span className="opacity-60">({p.stock} un.)</span>
                </button>
              ))}
              {lowStock.length > 8 && (
                <span className="rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  +{lowStock.length - 8} mais
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
