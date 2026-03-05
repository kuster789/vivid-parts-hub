import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      return new Response("Server error", { status: 500 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Mercado Pago sends either query params or JSON body
    const url = new URL(req.url);
    let topic = url.searchParams.get("topic") || url.searchParams.get("type");
    let resourceId = url.searchParams.get("id");

    // Also check JSON body for newer webhook format
    if (!topic || !resourceId) {
      try {
        const body = await req.json();
        topic = body.type || body.topic || topic;
        resourceId = body.data?.id?.toString() || resourceId;
        console.log("Webhook body:", JSON.stringify(body));
      } catch {
        // No JSON body
      }
    }

    console.log(`Webhook received: topic=${topic}, id=${resourceId}`);

    // We only care about payment notifications
    if (topic !== "payment" && topic !== "payment.updated" && topic !== "payment.created") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resourceId) {
      console.error("No resource ID in webhook");
      return new Response("Missing ID", { status: 400 });
    }

    // Fetch payment details from Mercado Pago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });

    if (!paymentRes.ok) {
      console.error(`MP API error: ${paymentRes.status}`);
      return new Response("MP API error", { status: 500 });
    }

    const payment = await paymentRes.json();
    console.log(`Payment ${resourceId}: status=${payment.status}, external_ref=${payment.external_reference}`);

    const orderId = payment.external_reference;
    if (!orderId) {
      console.log("No external_reference, skipping");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map MP payment status to our order status
    let orderStatus: string | null = null;
    switch (payment.status) {
      case "approved":
        orderStatus = "confirmed";
        break;
      case "rejected":
      case "cancelled":
        orderStatus = "cancelled";
        break;
      case "pending":
      case "in_process":
      case "authorized":
        // Keep as pending
        orderStatus = null;
        break;
      case "refunded":
      case "charged_back":
        orderStatus = "cancelled";
        break;
    }

    if (orderStatus) {
      const { error } = await supabase
        .from("orders")
        .update({ status: orderStatus })
        .eq("id", orderId);

      if (error) {
        console.error("DB update error:", error);
        return new Response("DB error", { status: 500 });
      }

      console.log(`Order ${orderId} updated to ${orderStatus}`);
    }

    return new Response(JSON.stringify({ received: true, order_id: orderId, new_status: orderStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Internal error", { status: 500 });
  }
});

