import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackingCode } = await req.json();

    if (!trackingCode || typeof trackingCode !== "string") {
      return new Response(JSON.stringify({ error: "Código de rastreio inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = trackingCode.replace(/\s/g, "").toUpperCase();

    // Try Correios proxy API
    const response = await fetch(
      `https://proxyapp.correios.com.br/v1/sro-rastro/${code}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Fallback: try linketrack
      const ltResponse = await fetch(
        `https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&codigo=${code}`
      );

      if (ltResponse.ok) {
        const ltData = await ltResponse.json();
        const events = (ltData.eventos || []).map((ev: any) => ({
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
          events,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        error: "Não foi possível consultar o rastreio. Tente novamente mais tarde.",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const objetos = data.objetos || [];

    if (objetos.length === 0) {
      return new Response(JSON.stringify({
        error: "Código de rastreio não encontrado.",
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro interno ao consultar rastreio." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
