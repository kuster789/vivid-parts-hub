import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  console.log("[mercadopago-create-payment] === New invocation ===");

  const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Configuração de pagamento ausente no servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { formData, orderId, paymentType } = body as {
      formData: any;
      orderId: string;
      paymentType: "credit_card" | "debit_card" | "pix" | "bank_transfer" | "ticket";
    };

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side validation: order belongs to user, get authoritative amount
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, total, status, shipping_name")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Pedido não pertence ao usuário" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionAmount = Number(order.total);

    // Build payload for /v1/payments based on paymentType
    const payload: Record<string, any> = {
      transaction_amount: transactionAmount,
      description: `Pedido #${orderId.slice(0, 8)} - Auto Peças Agrale`,
      external_reference: orderId,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      payer: {
        email: formData?.payer?.email || user.email,
      },
    };

    if (paymentType === "credit_card" || paymentType === "debit_card") {
      payload.token = formData.token;
      payload.installments = formData.installments || 1;
      payload.payment_method_id = formData.payment_method_id;
      if (formData.issuer_id) payload.issuer_id = formData.issuer_id;
      if (formData.payer?.identification) {
        payload.payer.identification = formData.payer.identification;
      }
      if (formData.payer?.first_name) payload.payer.first_name = formData.payer.first_name;
      if (formData.payer?.last_name) payload.payer.last_name = formData.payer.last_name;
    } else if (paymentType === "pix" || paymentType === "bank_transfer") {
      payload.payment_method_id = "pix";
      if (formData?.payer?.identification) {
        payload.payer.identification = formData.payer.identification;
      }
      if (formData?.payer?.first_name) payload.payer.first_name = formData.payer.first_name;
      if (formData?.payer?.last_name) payload.payer.last_name = formData.payer.last_name;
    } else if (paymentType === "ticket") {
      // Boleto
      payload.payment_method_id = formData?.payment_method_id || "bolbradesco";
      if (formData?.payer?.identification) {
        payload.payer.identification = formData.payer.identification;
      }
      payload.payer.first_name = formData?.payer?.first_name || order.shipping_name?.split(" ")[0] || "Cliente";
      payload.payer.last_name =
        formData?.payer?.last_name || order.shipping_name?.split(" ").slice(1).join(" ") || "Agrale";
      payload.payer.address = formData?.payer?.address || undefined;
    } else {
      return new Response(JSON.stringify({ error: `paymentType inválido: ${paymentType}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotencyKey = `${orderId}-${paymentType}-${Date.now()}`;
    console.log(`[mercadopago-create-payment] POST /v1/payments orderId=${orderId} type=${paymentType} amount=${transactionAmount}`);

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const mpBody = await mpRes.text();
    let mpData: any = {};
    try { mpData = JSON.parse(mpBody); } catch { /* ignore */ }

    if (!mpRes.ok) {
      console.error(`[mercadopago-create-payment] MP API error. status=${mpRes.status} body=${mpBody}`);
      return new Response(
        JSON.stringify({
          error: "Falha ao criar pagamento no Mercado Pago.",
          status: mpRes.status,
          details: mpData,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[mercadopago-create-payment] Created payment id=${mpData.id} status=${mpData.status}`);

    // Persist payment_id and method on the order
    await supabase
      .from("orders")
      .update({
        payment_id: String(mpData.id),
        payment_method: mpData.payment_method_id || paymentType,
      })
      .eq("id", orderId);

    // If already approved (e.g. credit card with no challenge), mark as confirmed immediately
    if (mpData.status === "approved") {
      await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId);
    }

    return new Response(
      JSON.stringify({
        id: mpData.id,
        status: mpData.status,
        status_detail: mpData.status_detail,
        payment_method_id: mpData.payment_method_id,
        point_of_interaction: mpData.point_of_interaction || null,
        transaction_details: mpData.transaction_details || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[mercadopago-create-payment] Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
