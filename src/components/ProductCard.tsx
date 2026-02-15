import { Link } from "react-router-dom";
import { ShoppingCart, Box } from "lucide-react";
import { useCart } from "@/context/CartContext";

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
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();

  return (
    <div className="card-industrial group flex flex-col overflow-hidden transition-all duration-300 hover:border-primary/40">
      <div className="relative flex h-48 items-center justify-center bg-secondary">
        <Box className="h-16 w-16 text-muted-foreground/40" />
        {product.has_3d && (
          <span className="absolute right-2 top-2 rounded-sm bg-primary px-2 py-0.5 font-display text-[10px] font-bold text-primary-foreground">
            3D
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute left-2 top-2 rounded-sm bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            Últimas unidades
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {product.brand?.toUpperCase()} · {product.model}
        </span>
        <Link to={`/produto/${product.id}`} className="mb-2 line-clamp-2 font-body text-sm font-semibold text-foreground transition-colors hover:text-primary">
          {product.name}
        </Link>
        <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-display text-lg font-bold text-primary">
            R$ {Number(product.price).toFixed(2).replace(".", ",")}
          </span>
          <button
            onClick={() => addItem({ id: product.id, name: product.name, price: Number(product.price), brand: product.brand, model: product.model, has_3d: product.has_3d ?? false })}
            className="btn-primary-glow rounded-md px-3 py-2 text-xs transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
