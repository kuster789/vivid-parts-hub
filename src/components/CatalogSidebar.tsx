import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronRight, SlidersHorizontal, Box, Package } from "lucide-react";
import { brands } from "@/data/products";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CatalogSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBrand = searchParams.get("marca") || "";
  const activeModel = searchParams.get("modelo") || "";
  const priceMin = Number(searchParams.get("preco_min")) || 0;
  const priceMax = Number(searchParams.get("preco_max")) || 5000;
  const inStock = searchParams.get("em_estoque") === "1";
  const has3D = searchParams.get("has_3d") === "1";

  const [localPriceRange, setLocalPriceRange] = useState<number[]>([priceMin, priceMax]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === "0") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("pagina");
    setSearchParams(params);
  };

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams);
    if (localPriceRange[0] > 0) {
      params.set("preco_min", String(localPriceRange[0]));
    } else {
      params.delete("preco_min");
    }
    if (localPriceRange[1] < 5000) {
      params.set("preco_max", String(localPriceRange[1]));
    } else {
      params.delete("preco_max");
    }
    params.delete("pagina");
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setLocalPriceRange([0, 5000]);
  };

  const hasActiveFilters = priceMin > 0 || priceMax < 5000 || inStock || has3D || activeBrand;

  return (
    <aside className="sticky top-4 w-64 shrink-0 hidden lg:block space-y-4">
      {/* Brands & Models */}
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

      {/* Advanced Filters */}
      <div className="card-industrial overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="p-4 space-y-5">
          {/* Price Range */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-3 block">
              Faixa de Preço
            </label>
            <Slider
              min={0}
              max={5000}
              step={50}
              value={localPriceRange}
              onValueChange={setLocalPriceRange}
              onValueCommit={applyPriceRange}
              className="mb-2"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>R$ {localPriceRange[0].toLocaleString("pt-BR")}</span>
              <span>R$ {localPriceRange[1].toLocaleString("pt-BR")}</span>
            </div>
          </div>

          {/* In Stock */}
          <div className="flex items-center justify-between">
            <Label htmlFor="in-stock" className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              Em estoque
            </Label>
            <Switch
              id="in-stock"
              checked={inStock}
              onCheckedChange={(checked) => updateFilter("em_estoque", checked ? "1" : null)}
            />
          </div>

          {/* Has 3D */}
          <div className="flex items-center justify-between">
            <Label htmlFor="has-3d" className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <Box className="h-3.5 w-3.5 text-muted-foreground" />
              Visualização 3D
            </Label>
            <Switch
              id="has-3d"
              checked={has3D}
              onCheckedChange={(checked) => updateFilter("has_3d", checked ? "1" : null)}
            />
          </div>
        </div>
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
