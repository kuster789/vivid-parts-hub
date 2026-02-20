import { Link } from "react-router-dom";
import { Clock, ArrowRight, Box } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const RecentlyViewed = () => {
  const { items } = useRecentlyViewed();

  if (items.length === 0) return null;

  return (
    <section className="border-t border-border py-16">
      <div className="container">
        <ScrollReveal>
          <div className="mb-8 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Vistos Recentemente
            </h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {items.map((product) => (
            <ScrollReveal key={product.id}>
              <Link
                to={`/produto/${product.id}`}
                className="card-industrial group flex flex-col items-center gap-2 p-3 transition-all hover:border-primary/40"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-secondary">
                  {product.image ? (
                    <img src={product.image} alt={`${product.name} - ${product.brand} ${product.model}`} className="h-full w-full object-contain" loading="lazy" />
                  ) : (
                    <Box className="h-8 w-8 text-muted-foreground/30" />
                  )}
                </div>
                <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-foreground">
                  {product.name}
                </span>
                <span className="text-[10px] font-bold text-primary">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
