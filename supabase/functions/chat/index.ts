import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    // Input validation
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Prompt injection detection patterns
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
      /you\s+are\s+now\s+(a|an)\s+/i,
      /system\s*:\s*/i,
      /\bact\s+as\b.*\b(admin|root|system)\b/i,
      /reveal\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions?|message)/i,
      /disregard\s+(all|any|your)\s+(previous|prior|above)/i,
    ];

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string" || msg.content.length > 2000) {
        return new Response(JSON.stringify({ error: "Formato de mensagem inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!["user", "assistant"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Role de mensagem inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (msg.role === "user") {
        for (const pattern of injectionPatterns) {
          if (pattern.test(msg.content)) {
            console.warn("Prompt injection attempt detected:", msg.content.substring(0, 100));
            return new Response(JSON.stringify({ error: "Mensagem não permitida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
      }
    }

    // Detect if user is requesting human support
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const humanKeywords = /\b(atendente|humano|pessoa|falar\s+com\s+algu[eé]m|suporte\s+humano|atendimento\s+humano|falar\s+com\s+voc[eê]s|ligar|telefonar|quero\s+falar|preciso\s+de\s+ajuda\s+humana)\b/i;
    
    if (lastUserMsg && humanKeywords.test(lastUserMsg.content)) {
      // Create notification for admin
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.from("notifications").insert({
          title: "🧑‍💼 Solicitação de atendimento humano",
          message: `Cliente solicitou atendimento humano no chat. Última mensagem: "${lastUserMsg.content.substring(0, 100)}"`,
          type: "support",
        });
      } catch (notifErr) {
        console.error("Failed to create support notification:", notifErr);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é o assistente virtual da Auto Peças Agrale, uma loja especializada em peças para motocicletas clássicas e esportivas das marcas Yamaha, Agrale, Cagiva e KTM.

Seu papel é:
- Ajudar clientes a encontrar peças
- Responder dúvidas sobre produtos, compatibilidade e especificações técnicas
- Informar sobre status de pedidos
- Orientar sobre formas de pagamento e entrega
- Ser cordial, técnico e objetivo

IMPORTANTE - Atendimento Humano:
Quando o cliente pedir para falar com uma pessoa, atendente humano, ou demonstrar que precisa de ajuda além do que você pode oferecer, SEMPRE responda com:
"Entendi! Vou te conectar com nosso atendimento humano. 😊
Clique no link abaixo para falar diretamente com nossa equipe pelo WhatsApp:
👉 https://wa.me/554396438823?text=Ol%C3%A1%2C%20vim%20pelo%20chat%20do%20site%20e%20preciso%20de%20atendimento
Nossa equipe está disponível de segunda a sexta, das 8h às 18h."

Informações da loja:
- WhatsApp: +55 43 9643-8823 (link: https://wa.me/554396438823)
- E-mail: autopecaagralecagiva@outlook.com
- Marcas: Yamaha (RD 125/135, RDZ 125/135, DT 180/200, RD 350), Agrale (13.5, 16.5, 27.5, Dakar 30.0, Elefant), Cagiva (Super City 125, Mito), KTM (950cc)

Responda sempre em português brasileiro. Seja conciso e útil. Sempre que mencionar contato, inclua o link do WhatsApp.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no assistente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
