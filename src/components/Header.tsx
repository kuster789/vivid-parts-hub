import { Link } from "react-router-dom";
import { ShoppingCart, Menu, X, User, LogOut, Shield, Heart, ChevronDown, BookOpen, Headphones, Wrench, Truck, Box } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { brands } from "@/data/products";

const Header = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, isEmployee, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenu, setMegaMenu] = useState<string | null>(null);
  const menuTimeout = useRef<ReturnType<typeof setTimeout>>();

  const openMenu = (menu: string) => {
    clearTimeout(menuTimeout.current);
    setMegaMenu(menu);
  };
  const closeMenu = () => {
    menuTimeout.current = setTimeout(() => setMegaMenu(null), 150);
  };

  useEffect(() => () => clearTimeout(menuTimeout.current), []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary sm:h-9 sm:w-9">
            <span className="font-display text-xs font-bold text-primary-foreground sm:text-sm">AP</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-sm font-bold tracking-widest text-foreground">AUTO PEÇAS</span>
            <span className="ml-1 font-display text-sm font-bold tracking-widest text-primary">AGRALE</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Início
          </Link>

          {/* Marcas Mega-menu */}
          <div className="relative" onMouseEnter={() => openMenu("marcas")} onMouseLeave={closeMenu} role="navigation" aria-label="Menu de marcas">
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-expanded={megaMenu === "marcas"} aria-haspopup="true">
              Marcas <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenu === "marcas" ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {megaMenu === "marcas" && (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2" onMouseEnter={() => openMenu("marcas")} onMouseLeave={closeMenu}>
                <div className="w-[480px] rounded-xl border border-border bg-background p-4 shadow-xl">
                  <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-primary">Nossas Marcas</p>
                  <div className="grid grid-cols-2 gap-2">
                    {brands.map((brand) => (
                      <Link
                        key={brand.slug}
                        to={`/marca/${brand.slug}`}
                        onClick={() => setMegaMenu(null)}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="h-7 w-7 object-contain" />
                          ) : (
                            <span className="text-lg">{brand.icon}</span>
                          )}
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-foreground">{brand.name}</span>
                          <span className="text-[10px] text-muted-foreground">{brand.models.length} modelos</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    <Link to="/catalogo" onClick={() => setMegaMenu(null)} className="flex items-center gap-2 text-xs font-medium text-primary hover:underline">
                      <Box className="h-3.5 w-3.5" /> Ver catálogo completo →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catálogo Mega-menu */}
          <div className="relative" onMouseEnter={() => openMenu("catalogo")} onMouseLeave={closeMenu} role="navigation" aria-label="Menu do catálogo">
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-expanded={megaMenu === "catalogo"} aria-haspopup="true">
              Catálogo <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenu === "catalogo" ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {megaMenu === "catalogo" && (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2" onMouseEnter={() => openMenu("catalogo")} onMouseLeave={closeMenu}>
                <div className="w-[320px] rounded-xl border border-border bg-background p-4 shadow-xl">
                  <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-primary">Navegação</p>
                  <div className="space-y-1">
                    {[
                      { to: "/catalogo", icon: Box, label: "Todos os Produtos", desc: "Catálogo completo" },
                      
                      { to: "/kits-revisao", icon: Wrench, label: "Kits de Revisão", desc: "Pacotes por modelo" },
                      { to: "/manuais", icon: BookOpen, label: "Manuais Técnicos", desc: "Documentação oficial" },
                    ].map(({ to, icon: Icon, label, desc }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMegaMenu(null)}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <span className="block text-sm font-semibold text-foreground">{label}</span>
                          <span className="text-[10px] text-muted-foreground">{desc}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/blog" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Blog</Link>

          {/* Suporte Mega-menu */}
          <div className="relative" onMouseEnter={() => openMenu("suporte")} onMouseLeave={closeMenu} role="navigation" aria-label="Menu de suporte">
            <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-expanded={megaMenu === "suporte"} aria-haspopup="true">
              Suporte <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenu === "suporte" ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {megaMenu === "suporte" && (
              <div className="absolute right-0 top-full z-50 pt-2" onMouseEnter={() => openMenu("suporte")} onMouseLeave={closeMenu}>
                <div className="w-[280px] rounded-xl border border-border bg-background p-4 shadow-xl">
                  <div className="space-y-1">
                    {[
                      { to: "/suporte", icon: Headphones, label: "Fale Conosco", desc: "Atendimento geral" },
                      { to: "/suporte-tecnico", icon: Wrench, label: "Suporte Técnico", desc: "Ajuda especializada" },
                      { to: "/rastreamento", icon: Truck, label: "Rastrear Pedido", desc: "Acompanhe seu envio" },
                    ].map(({ to, icon: Icon, label, desc }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMegaMenu(null)}
                        className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <div>
                          <span className="block text-sm font-semibold text-foreground">{label}</span>
                          <span className="text-[10px] text-muted-foreground">{desc}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {(isAdmin || isEmployee) && (
            <Link to="/admin" className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:text-primary/80">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <SearchBar />
          <ThemeToggle />
          <NotificationBell />

          {user && (
            <Link to="/favoritos" className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" title="Favoritos" aria-label="Meus favoritos">
              <Heart className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}

          <Link to="/carrinho" className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label={`Carrinho com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}>
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <Link to="/minha-conta" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Minha conta" aria-label="Minha conta">
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button onClick={() => signOut()} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Sair da conta">
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
          )}

          <button className="rounded-md p-2 text-muted-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Início</Link>
            <p className="mt-2 px-3 font-display text-[10px] font-bold uppercase tracking-widest text-primary">Marcas</p>
            {brands.map((brand) => (
              <Link key={brand.slug} to={`/marca/${brand.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
                {brand.logo ? <img src={brand.logo} alt={brand.name} className="h-5 w-5 object-contain" /> : <span>{brand.icon}</span>}
                {brand.name}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            <Link to="/catalogo" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Catálogo</Link>
            <Link to="/kits-revisao" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Kits de Revisão</Link>
            <Link to="/blog" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Blog</Link>
            <Link to="/suporte" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Suporte</Link>
            <Link to="/manuais" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Manuais</Link>
            <Link to="/rastreamento" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Meus Pedidos</Link>
            <Link to="/favoritos" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">Favoritos</Link>
            {(isAdmin || isEmployee) && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-primary">Admin</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
