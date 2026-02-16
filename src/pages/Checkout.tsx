import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShoppingBag, CheckCircle, Loader2, Truck, CreditCard, QrCode, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import CouponInput from "@/components/CouponInput";
import { useToast } from "@/hooks/use-toast";

interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: string;
  delivery_time: number;
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "", phone: "" });
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  // Check payment status from Mercado Pago redirect
  const paymentStatus = searchParams.get("status");
  const isPaymentApproved = paymentStatus === "approved";

  if (!user) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <p className="mb-4 text-muted-foreground">Faça login para finalizar a compra.</p>
        <Link to="/login" className="btn-primary-glow rounded-md px-6 py-3 text-sm">Entrar</Link>
      </main>
    );
  }

  if (items.length === 0 && !success && !isPaymentApproved) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Carrinho vazio.</p>
        <Link to="/catalogo" className="btn-primary-glow rounded-md px-6 py-3 text-sm">Ver Catálogo</Link>
      </main>
    );
  }

  if (success || isPaymentApproved) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <CheckCircle className="mb-4 h-16 w-16 text-success" />
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
          {isPaymentApproved ? "Pagamento Aprovado!" : "Pedido Realizado!"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {isPaymentApproved
            ? "Seu pagamento foi confirmado e o pedido está sendo processado."
            : "Seu pedido foi registrado com sucesso."}
        </p>
        <Link to="/rastreamento" className="btn-primary-glow rounded-md px-6 py-3 text-sm">Rastrear Pedido</Link>
      </main>
    );
  }

  const calculateShipping = async () => {
    if (!form.zip || form.zip.replace(/\D/g, "").length < 8) return;
    setShippingLoading(true);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      const { data, error } = await supabase.functions.invoke("shipping-calculate", {
        body: {
          postal_code_from: "86010000",
          postal_code_to: form.zip.replace(/\D/g, ""),
          weight: 1,
          insurance_value: totalPrice,
        },
      });

      if (error) throw error;
      setShippingOptions(data?.options || []);
    } catch (e) {
      console.error("Shipping error:", e);
    }
    setShippingLoading(false);
  };

  const shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  const finalTotal = totalPrice - discount + shippingCost;

  const createOrder = async () => {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total: finalTotal,
        discount,
        coupon_code: couponCode || null,
        shipping_name: form.name,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_zip: form.zip,
        shipping_phone: form.phone,
        notes: selectedShipping ? `Frete: ${selectedShipping.name} (${selectedShipping.company})` : undefined,
      })
      .select()
      .single();

    if (orderError || !order) return null;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      variations: item.selectedVariations,
    }));

    await supabase.from("order_items").insert(orderItems);
    return order;
  };

  const handlePayWithMercadoPago = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const requiredFields = ["name", "address", "city", "state", "zip", "phone"];
    const missing = requiredFields.filter((f) => !(form as any)[f]);
    if (missing.length > 0) {
      toast({ title: "Preencha todos os campos", description: "Todos os campos de endereço são obrigatórios.", variant: "destructive" });
      return;
    }

    setPaymentLoading(true);

    try {
      // Create the order first
      const order = await createOrder();
      if (!order) {
        toast({ title: "Erro ao criar pedido", description: "Tente novamente.", variant: "destructive" });
        setPaymentLoading(false);
        return;
      }

      // Create Mercado Pago preference
      const mpItems = items.map((item) => ({
        title: item.product.name,
        quantity: item.quantity,
        unit_price: Number(item.product.price),
      }));

      // Add shipping as item if selected
      if (selectedShipping && shippingCost > 0) {
        mpItems.push({
          title: `Frete: ${selectedShipping.name}`,
          quantity: 1,
          unit_price: shippingCost,
        });
      }

      // Add discount as negative item if exists
      if (discount > 0) {
        mpItems.push({
          title: `Desconto (${couponCode})`,
          quantity: 1,
          unit_price: -discount,
        });
      }

      const { data, error } = await supabase.functions.invoke("mercadopago-create-preference", {
        body: {
          items: mpItems,
          payer: { name: form.name },
          external_reference: order.id,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        clearCart();
        // Redirect to Mercado Pago checkout
        window.location.href = data.init_point;
      } else {
        throw new Error("URL de pagamento não retornada");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Erro no pagamento",
        description: err.message || "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
    setPaymentLoading(false);
  };

  const handleSubmitWithoutPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const order = await createOrder();
    if (order) {
      clearCart();
      setSuccess(true);
    }
    setLoading(false);
  };

  const updateForm = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <main className="py-8">
      <div className="container max-w-3xl">
        <Link to="/carrinho" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>
        <h1 className="section-title mb-6">Finalizar Compra</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <form onSubmit={handlePayWithMercadoPago} className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Endereço de Entrega</h2>
            {[
              { key: "name", label: "Nome completo", placeholder: "Seu nome" },
              { key: "address", label: "Endereço", placeholder: "Rua, número, complemento" },
              { key: "city", label: "Cidade", placeholder: "Cidade" },
              { key: "state", label: "Estado", placeholder: "SP" },
              { key: "zip", label: "CEP", placeholder: "00000-000" },
              { key: "phone", label: "Telefone", placeholder: "(11) 99999-9999" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
                <input
                  type="text"
                  required
                  value={(form as any)[key]}
                  onChange={(e) => updateForm(key, e.target.value)}
                  onBlur={key === "zip" ? calculateShipping : undefined}
                  placeholder={placeholder}
                  className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}

            {shippingLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Calculando frete...
              </div>
            )}

            {shippingOptions.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  <Truck className="h-4 w-4 text-primary" /> Opções de Frete
                </h3>
                <div className="flex flex-col gap-2">
                  {shippingOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedShipping(opt)}
                      className={`flex items-center justify-between rounded-md border p-3 text-left text-xs transition-all ${
                        selectedShipping?.id === opt.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{opt.name}</p>
                        <p className="text-muted-foreground">{opt.company} · {opt.delivery_time} dias úteis</p>
                      </div>
                      <span className="font-display font-bold text-primary">R$ {Number(opt.price).toFixed(2).replace(".", ",")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Coupon */}
            <CouponInput
              orderTotal={totalPrice}
              onApply={(d, c) => { setDiscount(d); setCouponCode(c); }}
              onRemove={() => { setDiscount(0); setCouponCode(""); }}
              appliedCode={couponCode}
            />

            {/* Payment buttons */}
            <div className="mt-4 space-y-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Forma de Pagamento</h2>

              <button
                type="submit"
                disabled={paymentLoading}
                className="btn-primary-glow flex w-full items-center justify-center gap-3 rounded-md py-3.5 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {paymentLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Pagar com Mercado Pago — R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>Aceita PIX, cartão de crédito/débito e boleto</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <QrCode className="h-4 w-4 text-primary" /> PIX
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CreditCard className="h-4 w-4 text-primary" /> Cartão
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <ExternalLink className="h-4 w-4 text-primary" /> Boleto
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitWithoutPayment}
                disabled={loading}
                className="w-full rounded-md border border-border py-2.5 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                {loading ? "Processando..." : "Confirmar pedido sem pagamento online"}
              </button>
            </div>
          </form>

          <div className="card-industrial h-fit p-5">
            <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Resumo</h2>
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="mb-2 flex justify-between text-xs">
                <span className="text-muted-foreground">{product.name} x{quantity}</span>
                <span className="text-foreground">R$ {(product.price * quantity).toFixed(2).replace(".", ",")}</span>
              </div>
            ))}
            {discount > 0 && (
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-success">Desconto ({couponCode})</span>
                <span className="text-success">-R$ {discount.toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            {selectedShipping && (
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Frete ({selectedShipping.name})</span>
                <span className="text-foreground">R$ {Number(selectedShipping.price).toFixed(2).replace(".", ",")}</span>
              </div>
            )}
            <div className="mt-3 border-t border-border pt-3 flex justify-between">
              <span className="font-display text-sm font-bold text-foreground">Total</span>
              <span className="font-display text-lg font-black text-primary">R$ {finalTotal.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
