import { useEffect, useRef, useState } from "react";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import { Loader2, QrCode, CreditCard, FileText, Copy, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mercado Pago Public Key (publishable — safe to ship in frontend)
const MP_PUBLIC_KEY =
  (import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined) ||
  "APP_USR-13623e98-97ee-4f36-84d7-bd651148baf9";

let mpInitialized = false;

interface Props {
  orderId: string;
  amount: number;
  payerEmail: string;
  payerCpf: string;
  payerName: string;
  onApproved: () => void;
}

type PaymentResult = {
  id: number | string;
  status: string;
  status_detail?: string;
  payment_method_id?: string;
  point_of_interaction?: any;
  transaction_details?: any;
};

const CheckoutBricks = ({ orderId, amount, payerEmail, payerCpf, payerName, onApproved }: Props) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"pix" | "card" | "ticket">("pix");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mpInitialized && MP_PUBLIC_KEY) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
      mpInitialized = true;
    }
  }, []);

  // Poll order status while waiting for PIX/Boleto confirmation
  useEffect(() => {
    if (!result || result.status === "approved") return;
    if (!["pending", "in_process"].includes(result.status)) return;

    pollingRef.current = window.setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .maybeSingle();
      if (data?.status === "confirmed") {
        if (pollingRef.current) window.clearInterval(pollingRef.current);
        onApproved();
      }
    }, 5000);

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [result, orderId, onApproved]);

  const submitPayment = async (
    paymentType: "credit_card" | "pix" | "ticket",
    formData: any
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-create-payment", {
        body: { orderId, paymentType, formData },
      });
      if (error) {
        const ctx: any = (error as any).context;
        let serverMsg = "";
        try {
          const txt = await ctx?.text?.();
          if (txt) {
            const j = JSON.parse(txt);
            serverMsg = j?.details?.message || j?.error || txt;
          }
        } catch { /* ignore */ }
        throw new Error(serverMsg || error.message || "Falha ao processar pagamento");
      }
      const r = data as PaymentResult;
      setResult(r);
      if (r.status === "approved") {
        onApproved();
      } else if (r.status === "rejected") {
        toast({
          title: "Pagamento recusado",
          description: r.status_detail || "Tente outro método.",
          variant: "destructive",
        });
      }
      return r;
    } catch (err: any) {
      toast({
        title: "Erro no pagamento",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ===== Renders =====

  // PIX QR code rendered after creation
  if (result && (result.payment_method_id === "pix" || tab === "pix")) {
    const poi = result.point_of_interaction?.transaction_data;
    if (poi?.qr_code) {
      const qrBase64 = poi.qr_code_base64;
      const pixCopia = poi.qr_code;
      return (
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <QrCode className="h-5 w-5" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider">
              Pague com PIX
            </h3>
          </div>
          {qrBase64 && (
            <div className="mx-auto w-fit rounded-lg border border-border bg-white p-3">
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR Code PIX"
                className="h-56 w-56"
              />
            </div>
          )}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              PIX Copia e Cola
            </p>
            <div className="flex items-stretch gap-2">
              <input
                readOnly
                value={pixCopia}
                className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pixCopia);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando confirmação do pagamento...
          </p>
        </div>
      );
    }
  }

  // Boleto result
  if (result && result.transaction_details?.external_resource_url) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-primary">
          <FileText className="h-5 w-5" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">Boleto Gerado</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Pague o boleto até o vencimento. A confirmação pode levar até 3 dias úteis.
        </p>
        <a
          href={result.transaction_details.external_resource_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary-glow inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold"
        >
          <FileText className="h-4 w-4" /> Visualizar Boleto
        </a>
      </div>
    );
  }

  // Status screen (fallback)
  if (result && result.id && result.status !== "approved") {
    return (
      <div className="mx-auto max-w-md">
        <StatusScreen initialization={{ paymentId: String(result.id) }} />
      </div>
    );
  }

  // Default: tabs
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-secondary">
        <TabsTrigger value="pix" className="flex items-center gap-1.5 text-xs">
          <QrCode className="h-3.5 w-3.5" /> PIX
        </TabsTrigger>
        <TabsTrigger value="card" className="flex items-center gap-1.5 text-xs">
          <CreditCard className="h-3.5 w-3.5" /> Cartão
        </TabsTrigger>
        <TabsTrigger value="ticket" className="flex items-center gap-1.5 text-xs">
          <FileText className="h-3.5 w-3.5" /> Boleto
        </TabsTrigger>
      </TabsList>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Processando pagamento...
        </div>
      )}

      <TabsContent value="pix" className="mt-5">
        <Payment
          key={`pix-${orderId}`}
          initialization={{
            amount,
            payer: { email: payerEmail },
          }}
          customization={{
            paymentMethods: { bankTransfer: "all" },
            visual: { hideFormTitle: true },
          }}
          onSubmit={async ({ formData }) => {
            try {
              await submitPayment("pix", {
                ...formData,
                payer: {
                  ...(formData as any)?.payer,
                  email: payerEmail,
                  identification: { type: "CPF", number: payerCpf },
                  first_name: payerName.split(" ")[0],
                  last_name: payerName.split(" ").slice(1).join(" ") || "—",
                },
              });
            } catch { /* toast already shown */ }
          }}
          onError={(e) => console.error("PIX Brick error:", e)}
        />
      </TabsContent>

      <TabsContent value="card" className="mt-5">
        <Payment
          key={`card-${orderId}`}
          initialization={{
            amount,
            payer: { email: payerEmail },
          }}
          customization={{
            paymentMethods: { creditCard: "all", debitCard: "all" },
            visual: { hideFormTitle: true },
          }}
          onSubmit={async ({ formData }) => {
            try {
              const fd: any = formData;
              await submitPayment("credit_card", {
                  ...fd,
                  payer: {
                    ...fd?.payer,
                    email: payerEmail,
                    identification:
                      fd?.payer?.identification || { type: "CPF", number: payerCpf },
                    first_name: payerName.split(" ")[0],
                    last_name: payerName.split(" ").slice(1).join(" ") || "—",
                  },
                });
            } catch { /* toast already shown */ }
          }}
          onError={(e) => console.error("Card Brick error:", e)}
        />
      </TabsContent>

      <TabsContent value="ticket" className="mt-5">
        <Payment
          key={`ticket-${orderId}`}
          initialization={{
            amount,
            payer: { email: payerEmail },
          }}
          customization={{
            paymentMethods: { ticket: "all" },
            visual: { hideFormTitle: true },
          }}
          onSubmit={async ({ formData }) => {
            try {
              const fd: any = formData;
              await submitPayment("ticket", {
                ...fd,
                payer: {
                  ...fd?.payer,
                  email: payerEmail,
                  identification:
                    fd?.payer?.identification || { type: "CPF", number: payerCpf },
                  first_name: payerName.split(" ")[0],
                  last_name: payerName.split(" ").slice(1).join(" ") || "—",
                },
              });
            } catch { /* toast already shown */ }
          }}
          onError={(e) => console.error("Ticket Brick error:", e)}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CheckoutBricks;
