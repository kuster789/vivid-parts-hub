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
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Navegação</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Início</Link>
            <Link to="/catalogo" className="text-sm text-muted-foreground hover:text-foreground">Catálogo</Link>
            <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">Suporte</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Marcas</h4>
          <div className="flex flex-col gap-2">
            <Link to="/catalogo?marca=yamaha" className="text-sm text-muted-foreground hover:text-foreground">Yamaha</Link>
            <Link to="/catalogo?marca=agrale" className="text-sm text-muted-foreground hover:text-foreground">Agrale</Link>
            <Link to="/catalogo?marca=cagiva" className="text-sm text-muted-foreground hover:text-foreground">Cagiva</Link>
            <Link to="/catalogo?marca=ktm" className="text-sm text-muted-foreground hover:text-foreground">KTM</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Contato</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>contato@autopecasagrale.com.br</span>
            <span>(11) 99999-9999</span>
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
