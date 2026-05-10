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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { items: clientItems, payer, external_reference, back_urls, coupon_code } = await req.json();

    if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0) {
      return new Response(JSON.stringify({ error: "Items are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // SERVER-SIDE PRICE CALCULATION
    const validatedItems = [];
    let subtotal = 0;

    for (const item of clientItems) {
      const { data: product, error: prodError } = await supabase
        .from("products")
        .select("id, name, price, stock")
        .eq("id", item.id)
        .single();

      if (prodError || !product) {
        throw new Error(`Produto não encontrado: ${item.title}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para: ${product.name}`);
      }

      const unitPrice = Number(product.price);
      validatedItems.push({
        id: product.id,
        title: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        currency_id: "BRL",
      });
      subtotal += unitPrice * item.quantity;
    }

    // Coupon validation (Server-side)
    let discount = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code)
        .eq("active", true)
        .single();

      if (coupon) {
        if (coupon.discount_percent) {
          discount = subtotal * (coupon.discount_percent / 100);
        } else if (coupon.discount_amount) {
          discount = coupon.discount_amount;
        }
      }
    }

    const total = subtotal - discount;

    const ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const preference = {
      items: validatedItems,
      payer: payer || {},
      external_reference: external_reference || "",
      back_urls: back_urls || {
        success: `${req.headers.get("origin")}/checkout?status=approved`,
        failure: `${req.headers.get("origin")}/checkout?status=rejected`,
        pending: `${req.headers.get("origin")}/checkout?status=pending`,
      },
      auto_return: "approved",
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
    return new Response(JSON.stringify({ id: data.id, init_point: data.init_point }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
