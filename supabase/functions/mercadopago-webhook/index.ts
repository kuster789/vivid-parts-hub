import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const WEBHOOK_SECRET = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");

    // 1. Signature Validation
    const signature = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");
    
    // Manual verification would go here if needed, but we MUST fetch from API to be sure
    // We rely on fetching the resource directly from MP API using the resourceId

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    let topic = url.searchParams.get("type") || url.searchParams.get("topic");
    let resourceId = url.searchParams.get("id") || url.searchParams.get("data.id");

    if (!topic || !resourceId) {
      const body = await req.json().catch(() => ({}));
      topic = topic || body.type || body.topic;
      resourceId = resourceId || body.data?.id;
    }

    if (topic !== "payment") {
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
    }

    // 2. Fetch directly from MP API (Source of Truth)
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    if (!paymentRes.ok) throw new Error("Failed to fetch payment from MP");
    const payment = await paymentRes.json();

    const orderId = payment.external_reference;
    if (!orderId) return new Response("No external_ref", { status: 200 });

    // 3. Validate Order Existence and Amount
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");

    // Amount validation
    if (Math.abs(order.total_amount - payment.transaction_amount) > 0.01) {
      console.error(`Amount mismatch: Order=${order.total_amount}, MP=${payment.transaction_amount}`);
      return new Response("Amount mismatch", { status: 400 });
    }

    // 4. Update Order Status
    let newStatus = order.status;
    if (payment.status === "approved") newStatus = "confirmed";
    else if (["rejected", "cancelled", "refunded"].includes(payment.status)) newStatus = "cancelled";

    if (newStatus !== order.status) {
      await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      console.log(`Order ${orderId} updated to ${newStatus}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(error.message, { status: 500 });
  }
});

