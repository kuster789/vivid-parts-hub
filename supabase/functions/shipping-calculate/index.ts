import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const MELHOR_ENVIO_TOKEN = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!MELHOR_ENVIO_TOKEN) throw new Error("MELHOR_ENVIO_TOKEN is not configured");

    const { postal_code_from, postal_code_to, weight, height, width, length, insurance_value } = await req.json();

    if (!postal_code_from || !postal_code_to) {
      return new Response(JSON.stringify({ error: "CEPs são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate CEP format
    const zipRegex = /^\d{8}$/;
    if (!zipRegex.test(postal_code_to.replace(/\D/g, ""))) {
      return new Response(JSON.stringify({ error: "Formato de CEP inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "AutoPecasAgrale autopecaagralecagiva@outlook.com",
      },
      body: JSON.stringify({
        from: { postal_code: postal_code_from },
        to: { postal_code: postal_code_to },
        products: [
          {
            id: "1",
            width: width || 15,
            height: height || 10,
            length: length || 20,
            weight: weight || 1,
            insurance_value: insurance_value || 0,
            quantity: 1,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Melhor Envio error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao calcular frete" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Filter out services with errors and format
    const options = data
      .filter((s: any) => !s.error)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        company: s.company?.name || "",
        price: s.custom_price || s.price,
        delivery_time: s.custom_delivery_time || s.delivery_time,
        currency: "BRL",
      }));

    return new Response(JSON.stringify({ options }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("shipping-calculate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
