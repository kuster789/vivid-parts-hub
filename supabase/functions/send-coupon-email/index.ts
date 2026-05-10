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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const authHeader = req.headers.get("Authorization");
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace("Bearer ", ""));

    // Require authentication to prevent abuse
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { email, lead_id } = await req.json();
    // Validate target email matches user email if applicable, or restrict to lead email
    const adminSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: lead } = await adminSupabase.from("leads").select("email").eq("id", lead_id).single();
    
    if (!lead || lead.email !== email) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: corsHeaders });
    }

    const couponCode = generateCouponCode();
    await adminSupabase.from("coupons").insert({ code: couponCode, discount_percent: 10, active: true, max_uses: 1 });
    await adminSupabase.from("leads").update({ coupon_code: couponCode }).eq("id", lead_id);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Auto Peças Agrale <onboarding@resend.dev>",
        to: [email],
        subject: "Seu cupom de 10% de desconto",
        html: `Cupom: ${couponCode}`,
      }),
    });

    return new Response(JSON.stringify({ success: true, coupon_code: couponCode }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
