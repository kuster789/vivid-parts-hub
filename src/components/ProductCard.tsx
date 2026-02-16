import { Link } from "react-router-dom";
import { ShoppingCart, Box, Heart, Eye } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    brand: string;
    model: string;
    stock: number;
    has_3d: boolean | null;
    images: string[] | null;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWished, toggle } = useWishlist();
  const price = Number(product.price);
  const installment = (price / 12).toFixed(2).replace(".", ",");

  return (
    <div className="card-industrial group flex flex-col overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative flex h-52 items-center justify-center bg-secondary overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <Box className="h-16 w-16 text-muted-foreground/30" />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.has_3d && (
            <span className="rounded-md bg-primary px-2 py-0.5 font-display text-[10px] font-bold text-primary-foreground shadow-sm">
              3D
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground shadow-sm">
              Últimas unidades
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
          {user && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur-sm transition-colors hover:bg-card"
            >
              <Heart className={`h-3.5 w-3.5 ${isWished(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
            </button>
          )}
          <Link
            to={`/produto/${product.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur-sm transition-colors hover:bg-card"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand?.toUpperCase()} · {product.model}
        </span>
        <Link to={`/produto/${product.id}`} className="mb-2 line-clamp-2 font-body text-sm font-semibold text-foreground transition-colors hover:text-primary">
          {product.name}
        </Link>
        {product.description && (
          <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-primary">
              R$ {price.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            ou 12x de <span className="font-semibold text-foreground">R$ {installment}</span>
          </p>
          <button
            onClick={() => addItem({ id: product.id, name: product.name, price, brand: product.brand, model: product.model, has_3d: product.has_3d ?? false })}
            className="btn-primary-glow flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
