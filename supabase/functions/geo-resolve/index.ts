import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { page_view_id, event_id } = await req.json();
    
    if (!page_view_id && !event_id) {
      return new Response(JSON.stringify({ error: "ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    let country = null, region = null, city = null;
    if (clientIp !== "unknown" && clientIp !== "127.0.0.1" && !clientIp.startsWith("10.") && !clientIp.startsWith("172.")) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city`);
        const geo = await geoRes.json();
        if (geo.status === "success") {
          country = geo.country; region = geo.regionName; city = geo.city;
        }
      } catch (_) { /* ignore geo failures */ }
    }

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (page_view_id) {
      await adminSupabase.from("page_views").update({ country, region, city }).eq("id", page_view_id);
    }
    
    if (event_id) {
      await adminSupabase.from("analytics_events").update({ 
        country, 
        state: region, 
        city 
      }).eq("id", event_id);
    }

    return new Response(JSON.stringify({ country, region, city }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
