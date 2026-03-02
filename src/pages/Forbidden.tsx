import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

const Forbidden = () => (
  <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
    <ShieldX className="h-16 w-16 text-destructive" />
    <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">Acesso Negado</h1>
    <p className="max-w-md text-muted-foreground">
      Você não tem permissão para acessar esta página. Entre em contato com o administrador.
    </p>
    <Link
      to="/"
      className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
    >
      Voltar ao Início
    </Link>
  </main>
);

export default Forbidden;
