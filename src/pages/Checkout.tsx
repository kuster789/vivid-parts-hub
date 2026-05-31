import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, ArrowRight, ShoppingBag, CheckCircle, Loader2, Truck,
  CreditCard, QrCode, ExternalLink, MapPin, Package, Shield, Lock, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import CouponInput from "@/components/CouponInput";
import CheckoutBricks from "@/components/CheckoutBricks";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";

interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: string;
  delivery_time: number;
}

type Step = 1 | 2 | 3;

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length > 6) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length > 0) return `(${digits}`;
  return "";
};

const formatCPF = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
};

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zip: "", phone: "", cpf: "" });
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm((prev) => ({
          ...prev,
          name: data.full_name || prev.name,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          city: data.city || prev.city,
          state: data.state || prev.state,
          zip: data.zip_code || prev.zip,
          cpf: (data as any).cpf || prev.cpf,
        }));
      }
    };
    loadProfile();
  }, [user]);

  const paymentStatus = searchParams.get("status");
  const isPaymentApproved = paymentStatus === "approved";

  useEffect(() => {
    if (items.length > 0) {
      trackEvent({
        event_type: "checkout_started",
        metadata: {
          items_count: items.length,
          total_price: totalPrice
        }
      });
    }
  }, []);

  useEffect(() => {
    if (isPaymentApproved) {
      trackEvent({
        event_type: "payment_approved",
        metadata: {
          status: "approved",
          source: "mercadopago"
        }
      });
    }
  }, [isPaymentApproved]);

  if (!user) {

    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <Lock className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="mb-2 font-display text-lg font-bold text-foreground">Acesso Restrito</p>
        <p className="mb-6 text-sm text-muted-foreground">Faça login para finalizar sua compra.</p>
        <Link to="/login" className="btn-primary-glow rounded-md px-8 py-3 text-sm font-semibold">Entrar</Link>
      </main>
    );
  }

  if (items.length === 0 && !success && !isPaymentApproved) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-2 font-display text-lg font-bold text-foreground">Carrinho vazio</p>
        <p className="mb-6 text-sm text-muted-foreground">Adicione produtos para continuar.</p>
        <Link to="/catalogo" className="btn-primary-glow rounded-md px-8 py-3 text-sm font-semibold">Ver Catálogo</Link>
      </main>
    );
  }

  if (success || isPaymentApproved) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <CheckCircle className="relative h-20 w-20 text-primary" />
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
          {isPaymentApproved ? "Pagamento Aprovado!" : "Pedido Realizado!"}
        </h1>
        <p className="mb-8 max-w-md text-sm text-muted-foreground">
          {isPaymentApproved
            ? "Seu pagamento foi confirmado. Você receberá uma notificação quando o pedido for enviado."
            : "Seu pedido foi registrado com sucesso. Acompanhe o status pelo rastreamento."}
        </p>
        <div className="flex gap-3">
          <Link to="/rastreamento" className="btn-primary-glow rounded-md px-6 py-3 text-sm font-semibold">
            Rastrear Pedido
          </Link>
          <Link to="/catalogo" className="rounded-md border border-border px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Continuar Comprando
          </Link>
        </div>
      </main>
    );
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 3) newErrors.name = "Nome deve ter pelo menos 3 caracteres";
    if (!form.address.trim()) newErrors.address = "Endereço é obrigatório";
    if (!form.city.trim()) newErrors.city = "Cidade é obrigatória";
    if (!form.state.trim() || form.state.trim().length !== 2) newErrors.state = "Use a sigla do estado (ex: SP)";
    if (!form.phone || form.phone.replace(/\D/g, "").length < 10) newErrors.phone = "Telefone inválido";
    if (!form.zip || form.zip.replace(/\D/g, "").length < 8) newErrors.zip = "CEP inválido";
    if (!form.cpf || form.cpf.replace(/\D/g, "").length !== 11) newErrors.cpf = "CPF inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep2 = () => {
    if (validateStep1()) setStep(2);
  };

  const calculateShipping = async () => {
    if (!form.zip || form.zip.replace(/\D/g, "").length < 8) return;
    setShippingLoading(true);
    setShippingOptions([]);
    setSelectedShipping(null);

    try {
      // Fetch product shipping dimensions from DB
      const productIds = items.map(i => i.product.id);
      const { data: productsData } = await supabase
        .from("products")
        .select("id, shipping_weight, shipping_width, shipping_height, shipping_length")
        .in("id", productIds);

      // Calculate combined dimensions: sum weights, use max dimensions
      let totalWeight = 0;
      let maxWidth = 11;
      let maxHeight = 2;
      let maxLength = 16;

      for (const item of items) {
        const pd = productsData?.find(p => p.id === item.product.id);
        const w = pd?.shipping_weight ?? 1;
        const width = pd?.shipping_width ?? 15;
        const height = pd?.shipping_height ?? 10;
        const length = pd?.shipping_length ?? 20;
        totalWeight += Number(w) * item.quantity;
        maxWidth = Math.max(maxWidth, width);
        maxHeight = Math.max(maxHeight, height);
        maxLength = Math.max(maxLength, length);
      }

      const { data, error } = await supabase.functions.invoke("shipping-calculate", {
        body: {
          postal_code_from: "86010000",
          postal_code_to: form.zip.replace(/\D/g, ""),
          weight: totalWeight,
          width: maxWidth,
          height: maxHeight,
          length: maxLength,
          insurance_value: totalPrice,
        },
      });
      if (error) throw error;
      setShippingOptions(data?.options || []);
    } catch (e) {
      console.error("Shipping error:", e);
      toast({ title: "Erro ao calcular frete", description: "Verifique o CEP e tente novamente.", variant: "destructive" });
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
        cpf: form.cpf.replace(/\D/g, ""),
        notes: selectedShipping ? `Frete: ${selectedShipping.name} (${selectedShipping.company})` : undefined,
      } as any)
      .select()
      .single();

    if (orderError || !order) return null;

    trackEvent({
      event_type: "order_created",
      metadata: {
        order_id: order.id,
        user_id: user.id,
        total: finalTotal,
        payment_method: "mercadopago"
      }
    });

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      variations: item.selectedVariations,
    }));

    await supabase.from("order_items").insert(orderItems);

    // Persist CPF on profile for reuse on future purchases
    await supabase
      .from("profiles")
      .update({ cpf: form.cpf.replace(/\D/g, "") } as any)
      .eq("user_id", user.id);

    return order;
  };

  const goToStep3 = async () => {
    if (!selectedShipping) {
      toast({ title: "Selecione o frete", description: "Calcule e escolha uma opção de entrega.", variant: "destructive" });
      return;
    }
    if (createdOrderId) {
      setStep(3);
      return;
    }
    setCreatingOrder(true);
    try {
      const order = await createOrder();
      if (!order) {
        toast({ title: "Erro ao criar pedido", description: "Tente novamente.", variant: "destructive" });
        return;
      }
      setCreatedOrderId(order.id);
      setStep(3);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePaymentApproved = () => {
    clearCart();
    setSuccess(true);
  };



  const updateForm = (key: string, value: string) => {
    let formatted = value;
    if (key === "zip") formatted = formatCEP(value);
    else if (key === "phone") formatted = formatPhone(value);
    else if (key === "cpf") formatted = formatCPF(value);
    else if (key === "state") formatted = value.toUpperCase().slice(0, 2);
    setForm({ ...form, [key]: formatted });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };

  const steps = [
    { num: 1 as Step, label: "Endereço", icon: MapPin },
    { num: 2 as Step, label: "Frete & Cupom", icon: Truck },
    { num: 3 as Step, label: "Pagamento", icon: CreditCard },
  ];

  return (
    <main className="py-8">
      <div className="container max-w-5xl">
        <Link to="/carrinho" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
        </Link>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {steps.map(({ num, label, icon: Icon }, i) => (
            <div key={num} className="flex items-center">
              {i > 0 && (
                <div className={`h-0.5 w-8 sm:w-16 transition-colors ${step >= num ? "bg-primary" : "bg-border"}`} />
              )}
              <button
                onClick={() => num < step && setStep(num)}
                disabled={num > step}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  step === num
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : step > num
                    ? "border-primary/50 bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                    : "border-border text-muted-foreground"
                }`}
              >
                {step > num ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{num}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main form area */}
          <div className="lg:col-span-3">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="card-industrial p-6 animate-fade-in">
                <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> Endereço de Entrega
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome completo *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Seu nome completo"
                      className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                        errors.name ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Endereço *</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      placeholder="Rua, número, complemento"
                      className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                        errors.address ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                      }`}
                    />
                    {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cidade *</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        placeholder="Cidade"
                        className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                          errors.city ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                        }`}
                      />
                      {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estado *</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => updateForm("state", e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                        className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm uppercase text-foreground placeholder:text-muted-foreground placeholder:normal-case focus:outline-none transition-colors ${
                          errors.state ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                        }`}
                      />
                      {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">CEP *</label>
                      <input
                        type="text"
                        value={form.zip}
                        onChange={(e) => updateForm("zip", e.target.value)}
                        placeholder="00000-000"
                        className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                          errors.zip ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                        }`}
                      />
                      {errors.zip && <p className="mt-1 text-xs text-destructive">{errors.zip}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Telefone *</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                          errors.phone ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                        }`}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">CPF *</label>
                    <input
                      type="text"
                      value={form.cpf}
                      onChange={(e) => updateForm("cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      className={`w-full rounded-lg border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                        errors.cpf ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                      }`}
                    />
                    {errors.cpf && <p className="mt-1 text-xs text-destructive">{errors.cpf}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">Obrigatório para emissão do pagamento (PIX, cartão ou boleto).</p>
                  </div>

                  <button
                    onClick={goToStep2}
                    className="btn-primary-glow flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold mt-2"
                  >
                    Continuar para Frete <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Shipping & Coupon */}
            {step === 2 && (
              <div className="card-industrial p-6 animate-fade-in">
                <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  <Truck className="h-4 w-4 text-primary" /> Frete & Cupom
                </h2>

                {/* Shipping address summary */}
                <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{form.name}</p>
                      <p className="text-xs text-muted-foreground">{form.address}</p>
                      <p className="text-xs text-muted-foreground">{form.city}, {form.state} · CEP {form.zip}</p>
                      <p className="text-xs text-muted-foreground">{form.phone}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline">Alterar</button>
                  </div>
                </div>

                {/* Calculate shipping */}
                <div className="mb-5">
                  <button
                    onClick={calculateShipping}
                    disabled={shippingLoading}
                    className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                  >
                    {shippingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    {shippingLoading ? "Calculando..." : "Calcular Frete"}
                  </button>
                </div>

                {shippingOptions.length > 0 && (
                  <div className="mb-5 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opções de Entrega</h3>
                    {shippingOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedShipping(opt)}
                        className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${
                          selectedShipping?.id === opt.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            selectedShipping?.id === opt.id ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}>
                            {selectedShipping?.id === opt.id && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{opt.name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {opt.company} · {opt.delivery_time} dias úteis
                            </p>
                          </div>
                        </div>
                        <span className="font-display text-sm font-bold text-primary">
                          R$ {Number(opt.price).toFixed(2).replace(".", ",")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Coupon */}
                <div className="mb-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cupom de Desconto</h3>
                  <CouponInput
                    orderTotal={totalPrice}
                    onApply={(d, c) => { setDiscount(d); setCouponCode(c); }}
                    onRemove={() => { setDiscount(0); setCouponCode(""); }}
                    appliedCode={couponCode}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <button
                    onClick={goToStep3}
                    disabled={creatingOrder}
                    className="btn-primary-glow flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {creatingOrder ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Criando pedido...</>
                    ) : (
                      <>Ir para Pagamento <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="card-industrial p-6 animate-fade-in">
                <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" /> Forma de Pagamento
                </h2>

                {/* Order summary card */}
                <div className="mb-5 rounded-lg border border-border bg-secondary/50 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega para</p>
                      <p className="text-sm font-semibold text-foreground">{form.name}</p>
                      <p className="text-xs text-muted-foreground">{form.city}, {form.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Frete</p>
                      <p className="text-sm font-semibold text-foreground">{selectedShipping?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedShipping?.delivery_time} dias úteis</p>
                    </div>
                  </div>
                </div>

                {/* Payment options */}
                <div className="space-y-3">
                  <button
                    onClick={handlePayWithMercadoPago}
                    disabled={paymentLoading}
                    className="btn-primary-glow flex w-full items-center justify-center gap-3 rounded-lg py-4 text-sm font-bold transition-all disabled:opacity-50"
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
                    <span>Métodos aceitos</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="flex items-center justify-center gap-6">
                    {[
                      { icon: QrCode, label: "PIX" },
                      { icon: CreditCard, label: "Cartão" },
                      { icon: ExternalLink, label: "Boleto" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-4 w-4 text-primary" /> {label}
                      </div>
                    ))}
                  </div>

                </div>

                {/* Trust badges */}
                <div className="mt-6 flex items-center justify-center gap-6 border-t border-border pt-5">
                  {[
                    { icon: Shield, label: "Compra Segura" },
                    { icon: Lock, label: "Dados Protegidos" },
                    { icon: Package, label: "Garantia" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary/70" /> {label}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Frete
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="card-industrial sticky top-20 p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" /> Resumo do Pedido
              </h2>

              <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                {items.map(({ product, quantity, selectedVariations }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                      <Package className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Qtd: {quantity}
                        {selectedVariations?.Cor && ` · Cor: ${selectedVariations.Cor}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-foreground">
                      R$ {(product.price * quantity).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-primary">Desconto ({couponCode})</span>
                    <span className="text-primary">-R$ {discount.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                {selectedShipping && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Frete ({selectedShipping.name})</span>
                    <span className="text-foreground">R$ {Number(selectedShipping.price).toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-display text-sm font-bold text-foreground">Total</span>
                  <span className="font-display text-xl font-black text-primary">
                    R$ {finalTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                {finalTotal > 0 && (
                  <p className="text-center text-[10px] text-muted-foreground">
                    ou 12x de R$ {(finalTotal / 12).toFixed(2).replace(".", ",")} sem juros
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
