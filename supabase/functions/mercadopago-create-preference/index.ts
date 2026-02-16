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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not configured");
    }

    const { items, payer, external_reference, back_urls } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Items are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.title || typeof item.title !== "string" || item.title.length > 200) {
        return new Response(JSON.stringify({ error: "Invalid item title" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const price = Number(item.unit_price);
      const qty = Number(item.quantity);
      if (isNaN(price) || price < -10000 || price > 100000) {
        return new Response(JSON.stringify({ error: "Invalid price" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (isNaN(qty) || qty < 1 || qty > 1000) {
        return new Response(JSON.stringify({ error: "Invalid quantity" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const preference = {
      items: items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),
      payer: payer || {},
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      external_reference: external_reference || "",
      back_urls: back_urls || {
        success: `${req.headers.get("origin") || "https://vivid-parts-hub.lovable.app"}/checkout?status=approved`,
        failure: `${req.headers.get("origin") || "https://vivid-parts-hub.lovable.app"}/checkout?status=rejected`,
        pending: `${req.headers.get("origin") || "https://vivid-parts-hub.lovable.app"}/checkout?status=pending`,
      },
      auto_return: "approved",
      statement_descriptor: "AUTO PECAS AGRALE",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago error:", response.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Mercado Pago API error", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating preference:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
