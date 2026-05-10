import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Gift, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";

const STORAGE_KEY = "lead_popup_dismissed";
const DELAY_MS = 8000;
const BLOCKED_PATHS = ["/login", "/cadastro", "/checkout", "/reset-password", "/admin"];

const LeadCapturePopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const isBlockedPage = BLOCKED_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isBlockedPage) {
      setVisible(false);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [isBlockedPage]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleCopy = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const sessionId = sessionStorage.getItem("pv_session") || null;
      const { data: leadData } = await supabase
        .from("leads")
        .insert({ email: email.trim(), source: "popup", session_id: sessionId } as any)
        .select("id")
        .single();

      if (leadData?.id) {
        trackEvent({
          event_type: "lead_created",
          metadata: {
            lead_id: leadData.id,
            source: "popup"
          }
        });
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-coupon-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ email: email.trim(), lead_id: leadData.id }),
        });
        const data = await res.json();
        if (data?.coupon_code) setCouponCode(data.coupon_code);
      }
    } catch {
      // fallback silently
    }
    setSubmitted(true);
    setTimeout(dismiss, 8000);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={dismiss}>
      <div
        className="relative mx-4 w-full max-w-md animate-fade-in rounded-xl border border-border bg-background p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center">
            <Gift className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Seu cupom chegou! 🎉</h3>
            {couponCode ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Use o código abaixo na finalização do pedido para ganhar <strong>10% de desconto</strong>:
                </p>
                <div className="mb-4 rounded-lg border-2 border-dashed border-primary bg-primary/5 px-6 py-4">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Código do cupom</p>
                  <p className="font-mono text-2xl font-bold tracking-wider text-primary">{couponCode}</p>
                  <p className="mt-1 text-xs text-muted-foreground">10% de desconto · Uso único · Primeira compra</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="mx-auto flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado!" : "Copiar código"}
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Seu cupom de <strong>10% de desconto</strong> foi gerado. Confira na sua caixa de entrada!
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-xl font-bold uppercase tracking-wide text-foreground">
                10% de desconto
              </h3>
              <p className="text-sm text-muted-foreground">
                Na sua primeira compra! Cadastre seu email e receba o cupom exclusivo.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button type="submit" className="btn-primary-glow w-full rounded-lg py-3 text-sm font-semibold">
                Quero meu desconto!
              </button>
            </form>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Não enviamos spam. Você pode cancelar a qualquer momento.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LeadCapturePopup;
