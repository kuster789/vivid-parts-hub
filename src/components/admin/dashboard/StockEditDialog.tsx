import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  stock: number;
}

interface StockEditDialogProps {
  product: ProductRow | null;
  stockValue: string;
  onStockChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

const StockEditDialog = ({ product, stockValue, onStockChange, onSave, onClose, saving }: StockEditDialogProps) => (
  <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Editar Estoque</DialogTitle>
      </DialogHeader>
      {product && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.brand.toUpperCase()} · Estoque atual: {product.stock} un.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nova quantidade</label>
            <Input
              type="number"
              min="0"
              value={stockValue}
              onChange={(e) => onStockChange(e.target.value)}
              className="mt-1"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              aria-label="Nova quantidade em estoque"
            />
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default StockEditDialog;
