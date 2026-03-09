import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateCouponCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const suffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `BEMVINDO10-${suffix}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { email, lead_id } = await req.json();

    if (!email || !lead_id) {
      return new Response(JSON.stringify({ error: "Missing email or lead_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate coupon
    const couponCode = generateCouponCode();

    // Insert coupon into coupons table
    const { error: couponError } = await supabase.from("coupons").insert({
      code: couponCode,
      discount_percent: 10,
      discount_amount: 0,
      max_uses: 1,
      active: true,
      min_order_value: 0,
    });

    if (couponError) {
      console.error("Coupon insert error:", couponError);
      return new Response(JSON.stringify({ error: "Failed to create coupon" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update lead with the coupon code
    await supabase.from("leads").update({ coupon_code: couponCode }).eq("id", lead_id);

    // Send email
    const htmlBody = `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:24px 32px;">
        <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">Auto Peças Agrale</h1>
        <p style="margin:4px 0 0;color:#fecaca;font-size:12px;">Seu cupom de primeira compra!</p>
      </div>
      <div style="padding:32px;text-align:center;">
        <p style="font-size:32px;margin:0;">🎉</p>
        <h2 style="margin:12px 0 4px;font-size:20px;color:#111827;font-weight:700;">10% de desconto!</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Na sua primeira compra na Auto Peças Agrale</p>
        
        <div style="background:#fef2f2;border:2px dashed #dc2626;border-radius:12px;padding:20px;margin:0 auto;max-width:300px;">
          <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#991b1b;">Seu cupom</p>
          <p style="margin:0;font-size:24px;font-weight:800;color:#dc2626;letter-spacing:2px;">${couponCode}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#991b1b;">Uso único · Válido para primeira compra</p>
        </div>
        
        <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">Use o código acima no checkout para aplicar o desconto.</p>
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
        reply_to: "autopecaagralecagiva@outlook.com",
        to: [email],
        subject: "🎉 Seu cupom de 10% de desconto — Auto Peças Agrale",
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

    return new Response(JSON.stringify({ success: true, coupon_code: couponCode }), {
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
