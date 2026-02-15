import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const Header = () => {
  const { totalItems } = useCart();
  const { user, isAdmin, isEmployee, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <span className="font-display text-sm font-bold text-primary-foreground">AP</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-sm font-bold tracking-widest text-foreground">AUTO PEÇAS</span>
            <span className="ml-1 font-display text-sm font-bold tracking-widest text-primary">AGRALE</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Início</Link>
          <Link to="/catalogo" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Catálogo</Link>
          <Link to="/suporte" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Suporte</Link>
          {(isAdmin || isEmployee) && (
            <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/carrinho" className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <Link to="/suporte" className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <User className="h-5 w-5" />
              </Link>
              <button onClick={() => signOut()} className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
          )}

          <button className="rounded-md p-2 text-muted-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground">Início</Link>
            <Link to="/catalogo" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground">Catálogo</Link>
            <Link to="/suporte" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-muted-foreground">Suporte</Link>
            {(isAdmin || isEmployee) && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-primary">Admin</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
