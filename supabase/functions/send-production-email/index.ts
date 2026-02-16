import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stageLabels: Record<string, string> = {
  producao: "em produção",
  acabamento: "em acabamento",
  pintura: "em pintura",
  embalagem: "sendo embalado",
  postagem: "postado para envio",
};

const stageEmojis: Record<string, string> = {
  producao: "🏭",
  acabamento: "✨",
  pintura: "🎨",
  embalagem: "📦",
  postagem: "📬",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { order_id, production_stage, tracking_code, user_id } = await req.json();

    if (!order_id || !production_stage || !user_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      console.error("Could not find user email:", userError);
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    const stageLabel = stageLabels[production_stage] || production_stage;
    const stageEmoji = stageEmojis[production_stage] || "📋";
    const orderId = order_id.slice(0, 8);

    const trackingSection = production_stage === "postagem" && tracking_code
      ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:16px;">
           <p style="margin:0;font-weight:600;color:#166534;">📮 Código de Rastreio</p>
           <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#15803d;letter-spacing:1px;">${tracking_code}</p>
         </div>`
      : "";

    const htmlBody = `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">Auto Peças Agrale</h1>
        <p style="margin:4px 0 0;color:#fecaca;font-size:12px;">Atualização do seu pedido</p>
      </div>
      <div style="padding:32px;">
        <p style="font-size:14px;color:#6b7280;margin:0 0 8px;">Pedido <strong>#${orderId}</strong></p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;text-align:center;">
          <p style="font-size:32px;margin:0;">${stageEmoji}</p>
          <p style="margin:8px 0 0;font-size:16px;font-weight:600;color:#991b1b;">Seu pedido está ${stageLabel}</p>
        </div>
        ${trackingSection}
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">Acompanhe seu pedido no nosso site.</p>
      </div>
    </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Auto Peças Agrale <onboarding@resend.dev>",
        to: [email],
        subject: `${stageEmoji} Pedido #${orderId} — ${stageLabel}`,
        html: htmlBody,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: "Email send failed", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
