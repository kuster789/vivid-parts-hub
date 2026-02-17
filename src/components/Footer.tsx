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
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link>
            <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">Contato</Link>
            <Link to="/visualizacao-3d" className="text-sm text-muted-foreground hover:text-foreground">Visualização 3D</Link>
            <Link to="/qualidade" className="text-sm text-muted-foreground hover:text-foreground">Qualidade Garantida</Link>
            <Link to="/envio" className="text-sm text-muted-foreground hover:text-foreground">Envio Nacional</Link>
            <Link to="/suporte-tecnico" className="text-sm text-muted-foreground hover:text-foreground">Suporte Técnico</Link>
            <Link to="/manuais" className="text-sm text-muted-foreground hover:text-foreground">Manuais Técnicos</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Suporte</h4>
          <div className="flex flex-col gap-2">
            <Link to="/suporte" className="text-sm text-muted-foreground hover:text-foreground">Central de Ajuda</Link>
            <Link to="/rastreamento" className="text-sm text-muted-foreground hover:text-foreground">Rastrear Pedido</Link>
            <Link to="/favoritos" className="text-sm text-muted-foreground hover:text-foreground">Lista de Desejos</Link>
            <Link to="/privacidade" className="text-sm text-muted-foreground hover:text-foreground">Política de Privacidade</Link>
            <Link to="/termos" className="text-sm text-muted-foreground hover:text-foreground">Termos de Uso</Link>
            <Link to="/devolucao" className="text-sm text-muted-foreground hover:text-foreground">Política de Devolução</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Contato</h4>
          <div className="flex flex-col gap-3">
            <a
              href="mailto:autopecaagralecagiva@outlook.com?subject=Dúvida%20sobre%20compra&body=Olá%20vim%20pelo%20Site%20estou%20com%20dúvidas%20sobre%20como%20comprar"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Enviar E-mail
            </a>
            <a
              href="https://wa.me/554396438823?text=Olá%20vim%20pelo%20Site%20estou%20com%20dúvidas%20sobre%20como%20comprar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              WhatsApp
            </a>
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
