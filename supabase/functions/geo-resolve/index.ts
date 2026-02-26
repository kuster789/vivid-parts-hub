import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page_view_id } = await req.json();
    if (!page_view_id) {
      return new Response(JSON.stringify({ error: "Missing page_view_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get visitor IP from request headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Use free ip-api.com for geolocation (no key needed, 45 req/min)
    let country = null;
    let region = null;
    let city = null;

    if (clientIp && clientIp !== "unknown" && clientIp !== "127.0.0.1") {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city&lang=pt-BR`
        );
        const geo = await geoRes.json();
        if (geo.status === "success") {
          country = geo.country;
          region = geo.regionName;
          city = geo.city;
        }
      } catch {
        // Geo lookup failed silently
      }
    }

    // Update page_view with geo data using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase
      .from("page_views")
      .update({ country, region, city })
      .eq("id", page_view_id);

    return new Response(
      JSON.stringify({ country, region, city }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
