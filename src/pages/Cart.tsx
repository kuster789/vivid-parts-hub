import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, LogIn } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-2 font-display text-lg font-bold text-foreground">Carrinho vazio</p>
        <p className="mb-6 text-sm text-muted-foreground">Adicione produtos para começar.</p>
        <Link to="/catalogo" className="btn-primary-glow inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm">
          Ver Catálogo
        </Link>
      </div>
    );
  }

  return (
    <main className="py-8">
      <div className="container max-w-4xl">
        <Link to="/catalogo" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <h1 className="section-title mb-6">Carrinho</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-3">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="card-industrial flex items-center gap-4 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/produto/${product.id}`} className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary">
                      {product.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{product.brand.toUpperCase()} · {product.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)} className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-foreground">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)} className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="w-24 text-right font-display text-sm font-bold text-primary">
                    R$ {(product.price * quantity).toFixed(2).replace(".", ",")}
                  </span>
                  <button onClick={() => removeItem(product.id)} className="rounded-md p-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card-industrial h-fit p-6">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Resumo</h2>
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Frete</span>
              <span className="text-muted-foreground">A calcular</span>
            </div>
            <div className="mb-6 border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="font-display text-sm font-bold text-foreground">Total</span>
                <span className="font-display text-xl font-black text-primary">
                  R$ {totalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
            {user ? (
              <Link to="/checkout" className="btn-primary-glow mb-3 block w-full rounded-md py-3 text-center text-sm transition-all">
                Finalizar Compra
              </Link>
            ) : (
              <Link to="/login" state={{ from: { pathname: "/carrinho" } }} className="btn-primary-glow mb-3 flex w-full items-center justify-center gap-2 rounded-md py-3 text-center text-sm transition-all">
                <LogIn className="h-4 w-4" /> Faça login para finalizar
              </Link>
            )}
            <button onClick={clearCart} className="w-full rounded-md border border-border py-2 text-xs text-muted-foreground transition-colors hover:text-destructive">
              Limpar carrinho
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
