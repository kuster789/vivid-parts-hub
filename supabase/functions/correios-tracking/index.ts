import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackingCode } = await req.json();
    console.log("Tracking code received:", trackingCode);

    if (!trackingCode || typeof trackingCode !== "string") {
      return new Response(JSON.stringify({ error: "Código de rastreio inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = trackingCode.replace(/\s/g, "").toUpperCase();

    // Try linketrack API (free, reliable)
    try {
      console.log("Trying linketrack API...");
      const ltResponse = await fetch(
        `https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&codigo=${code}`
      );
      console.log("Linketrack status:", ltResponse.status);

      if (ltResponse.ok) {
        const ltData = await ltResponse.json();
        console.log("Linketrack data:", JSON.stringify(ltData).slice(0, 500));

        if (ltData.eventos && ltData.eventos.length > 0) {
          const events = ltData.eventos.map((ev: any) => ({
            status: ev.status || "",
            date: ev.data || "",
            time: ev.hora || "",
            location: ev.local || "",
            origin: ev.origem || "",
            destination: ev.destino || "",
          }));

          return new Response(JSON.stringify({
            trackingCode: code,
            type: ltData.servico || "ENCOMENDA",
            estimatedDelivery: ltData.ultimo ? `${ltData.ultimo}` : null,
            events,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        const errText = await ltResponse.text();
        console.log("Linketrack error:", errText);
      }
    } catch (e) {
      console.log("Linketrack exception:", e.message);
    }

    // Try Correios proxy API as fallback
    try {
      console.log("Trying Correios proxy API...");
      const response = await fetch(
        `https://proxyapp.correios.com.br/v1/sro-rastro/${code}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
        }
      );
      console.log("Correios proxy status:", response.status);

      if (response.ok) {
        const data = await response.json();
        const objetos = data.objetos || [];

        if (objetos.length > 0) {
          const obj = objetos[0];
          const events = (obj.eventos || []).map((ev: any) => ({
            status: ev.descricao || "",
            date: ev.dtHrCriado ? new Date(ev.dtHrCriado).toLocaleDateString("pt-BR") : "",
            time: ev.dtHrCriado ? new Date(ev.dtHrCriado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
            location: ev.unidade?.nome
              ? `${ev.unidade.nome}${ev.unidade.endereco?.cidade ? `, ${ev.unidade.endereco.cidade}` : ""}${ev.unidade.endereco?.uf ? ` - ${ev.unidade.endereco.uf}` : ""}`
              : "",
            origin: "",
            destination: ev.unidadeDestino?.nome
              ? `${ev.unidadeDestino.nome}${ev.unidadeDestino.endereco?.cidade ? `, ${ev.unidadeDestino.endereco.cidade}` : ""}${ev.unidadeDestino.endereco?.uf ? ` - ${ev.unidadeDestino.endereco.uf}` : ""}`
              : "",
          }));

          return new Response(JSON.stringify({
            trackingCode: code,
            type: obj.tipoPostal?.categoria || "ENCOMENDA",
            estimatedDelivery: obj.dtPrevista || null,
            events,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        const errText = await response.text();
        console.log("Correios proxy error:", errText);
      }
    } catch (e) {
      console.log("Correios proxy exception:", e.message);
    }

    return new Response(JSON.stringify({
      error: "Não foi possível consultar o rastreio. Verifique o código e tente novamente.",
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Fatal error:", error.message);
    return new Response(JSON.stringify({ error: "Erro interno ao consultar rastreio." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
