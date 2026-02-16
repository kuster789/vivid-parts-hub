import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="font-display text-xs font-bold text-primary-foreground">AP</span>
            </div>
            <span className="font-display text-sm font-bold tracking-widest text-foreground">AUTO PEÇAS AGRALE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Peças e componentes de alta qualidade para motocicletas clássicas e esportivas.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Empresa</h4>
          <div className="flex flex-col gap-2">
            <Link to="/sobre" className="text-sm text-muted-foreground hover:text-foreground">Sobre Nós</Link>
            <Link to="/catalogo" className="text-sm text-muted-foreground hover:text-foreground">Catálogo</Link>
            <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">Contato</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Suporte</h4>
          <div className="flex flex-col gap-2">
            <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">Central de Ajuda</Link>
            <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground">Política de Privacidade</Link>
            <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground">Termos de Uso</Link>
            <Link to="/devolucao" className="text-sm text-muted-foreground hover:text-foreground">Política de Devolução</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Contato</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>autopecaagralecagiva@outlook.com</span>
            <span>WhatsApp: +55 43 9643-8823</span>
          </div>
          <h4 className="mb-2 mt-4 font-display text-xs font-bold uppercase tracking-wider text-foreground">Marcas</h4>
          <div className="flex flex-wrap gap-2">
            {["yamaha", "agrale", "cagiva", "ktm"].map((b) => (
              <Link key={b} to={`/catalogo?marca=${b}`} className="text-xs text-muted-foreground hover:text-foreground capitalize">{b}</Link>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © 2026 Auto Peças Agrale. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
