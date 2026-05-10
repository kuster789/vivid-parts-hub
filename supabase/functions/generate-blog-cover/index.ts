import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const authHeader = req.headers.get("Authorization");
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace("Bearer ", ""));

    // REQUIRE ADMIN ROLE
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user?.id);
    const isAdmin = roles?.some(r => ["admin", "admin_master"].includes(r.role));

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerar capas" }), { status: 403, headers: corsHeaders });
    }

    const { slug, prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    const aiData = await aiResp.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    const adminSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const path = `blog-covers/${slug}.png`;
    await adminSupabase.storage.from("product-images").upload(path, binaryData, { contentType: "image/png", upsert: true });
    const { data: urlData } = adminSupabase.storage.from("product-images").getPublicUrl(path);
    
    await adminSupabase.from("blog_posts").update({ cover_image: urlData.publicUrl }).eq("slug", slug);

    return new Response(JSON.stringify({ success: true, url: urlData.publicUrl }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
