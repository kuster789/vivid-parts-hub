import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  applyStoredGoogleConsent,
  getGoogleConsentChoice,
  updateGoogleConsent,
} from "@/lib/googleAnalytics";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    applyStoredGoogleConsent();
    setVisible(getGoogleConsentChoice() === null);
  }, []);

  const choose = (choice: "granted" | "denied") => {
    updateGoogleConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 px-4 py-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl space-y-1">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Privacidade e cookies
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Usamos cookies e tags do Google para medir acessos, compras, carrinho e cliques no WhatsApp.
            Você pode aceitar para ajudar na melhoria dos anúncios ou recusar cookies de marketing.
            Veja nossa <Link to="/privacidade" className="text-primary underline-offset-4 hover:underline">Política de Privacidade</Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-md border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="btn-primary-glow rounded-md px-5 py-2 text-xs font-semibold"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
