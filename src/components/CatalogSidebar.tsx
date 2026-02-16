import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { brands } from "@/data/products";
import { cn } from "@/lib/utils";

const CatalogSidebar = () => {
  const [searchParams] = useSearchParams();
  const activeBrand = searchParams.get("marca") || "";
  const activeModel = searchParams.get("modelo") || "";

  return (
    <aside className="sticky top-4 w-64 shrink-0 hidden lg:block">
      <div className="card-industrial overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-foreground">
            Marcas & Modelos
          </h3>
        </div>
        <nav className="p-2">
          {brands.map((brand) => (
            <BrandGroup
              key={brand.slug}
              brand={brand}
              isActive={activeBrand === brand.slug}
              activeModel={activeBrand === brand.slug ? activeModel : ""}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
};

interface BrandGroupProps {
  brand: (typeof brands)[0];
  isActive: boolean;
  activeModel: string;
}

const BrandGroup = ({ brand, isActive, activeModel }: BrandGroupProps) => {
  const [open, setOpen] = useState(isActive);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        {brand.logo ? (
          <img src={brand.logo} alt={brand.name} className="h-5 w-auto object-contain" />
        ) : (
          <span className="text-sm">{brand.icon}</span>
        )}
        <span className="flex-1 font-medium">{brand.name}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {open && (
        <div className="ml-4 mt-0.5 border-l border-border pl-2">
          <Link
            to={`/catalogo?marca=${brand.slug}`}
            className={cn(
              "block rounded-sm px-3 py-1.5 text-xs transition-colors",
              isActive && !activeModel
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todos os modelos
          </Link>
          {brand.models.map((model) => (
            <Link
              key={model}
              to={`/catalogo?marca=${brand.slug}&modelo=${encodeURIComponent(model)}`}
              className={cn(
                "block rounded-sm px-3 py-1.5 text-xs transition-colors",
                activeModel === model
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {model}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogSidebar;
