# Google Ads / GA4 Tracking

Este projeto usa **gtag direto** (sem GTM) com Consent Mode v2.

## IDs configurados

- GA4 Measurement ID: `G-LXHHL5SZ4P`
- Google Ads ID: `AW-862271353`
- Conversão Compra: `AW-862271353/PUveCKvY0sMcEPnulJsD`
- Conversão WhatsApp: `AW-862271353/NHzYCK7Y0sMcEPnulJsD`
- Conversão Adicionar ao carrinho: `AW-862271353/cEjgCLHY0sMcEPnulJsD`

## Arquivos principais

- `index.html` — carrega Google tag e define Consent Mode v2 com padrão `denied`.
- `src/lib/googleAnalytics.ts` — camada de eventos GA4/Google Ads.
- `src/components/CookieConsent.tsx` — banner LGPD que atualiza Consent Mode para `granted` ou `denied`.
- `src/hooks/usePageTracking.ts` — envia page view em trocas de rota SPA.

## Eventos enviados

| Ação | GA4 | Google Ads |
|---|---|---|
| Troca de página SPA | `config/page_view` | remarketing/config Ads |
| Visualizar produto | `view_item` | — |
| Adicionar ao carrinho | `add_to_cart` | conversão `LABEL_ADD_TO_CART` |
| Iniciar checkout | `begin_checkout` | — |
| Compra aprovada | `purchase` | conversão `LABEL_PURCHASE` |
| Clique WhatsApp | `whatsapp_click` | conversão `LABEL_WHATSAPP` |

## Observações de implementação

- O analytics interno existente (`src/utils/analytics.ts`, tabela `analytics_events`) foi preservado.
- A compra usa `order.id` como `transaction_id` e tem deduplicação no `localStorage` para evitar contagem dupla.
- Nenhum dado pessoal é enviado nos eventos Google; apenas produto, valor, quantidade, página e origem do clique.
- Consent Mode inicia como `denied`; o banner atualiza para `granted` quando o usuário aceita.

## Como validar depois do deploy

1. Abrir o site em produção.
2. Usar Google Tag Assistant: https://tagassistant.google.com/
3. Confirmar que aparecem:
   - `G-LXHHL5SZ4P`
   - `AW-862271353`
4. Aceitar o banner de cookies.
5. Testar:
   - abrir uma página de produto → `view_item`
   - adicionar ao carrinho → `add_to_cart` + conversão Ads
   - clicar no WhatsApp → `whatsapp_click` + conversão Ads
   - finalizar uma compra teste → `purchase` + conversão Ads
6. No GA4, abrir **Admin > DebugView** ou Relatórios em tempo real.
7. No Google Ads, conferir o status das conversões após algumas horas.
