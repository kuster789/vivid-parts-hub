import { useState } from "react";
import { Tag, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CouponInputProps {
  orderTotal: number;
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
  appliedCode: string;
}

const CouponInput = ({ orderTotal, onApply, onRemove, appliedCode }: CouponInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("validate_coupon", {
      _code: code.trim(),
      _order_total: orderTotal,
    });

    if (rpcError) {
      setError("Erro ao validar cupom");
      setLoading(false);
      return;
    }

    const result = data as { valid: boolean; error?: string; discount?: number; code?: string };

    if (!result.valid) {
      setError(result.error || "Cupom inválido");
      setLoading(false);
      return;
    }

    onApply(result.discount ?? 0, result.code ?? code.toUpperCase().trim());
    setLoading(false);
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-medium text-primary">
          <Check className="h-3.5 w-3.5" />
          Cupom {appliedCode} aplicado
        </span>
        <button onClick={() => { onRemove(); setCode(""); }} className="text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="Código do cupom"
            className="w-full rounded-md border border-border bg-secondary pl-9 pr-3 py-2 text-sm uppercase text-foreground placeholder:text-muted-foreground placeholder:normal-case focus:border-primary focus:outline-none"
          />
        </div>
        <button onClick={apply} disabled={loading || !code.trim()} className="btn-primary-glow rounded-md px-4 py-2 text-xs disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default CouponInput;
