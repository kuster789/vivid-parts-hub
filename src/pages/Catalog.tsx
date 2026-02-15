import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Grid3X3, List } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products, brands } from "@/data/products";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBrand = searchParams.get("marca") || "";
  const [activeModel, setActiveModel] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const currentBrand = brands.find((b) => b.slug === activeBrand);

  const filtered = useMemo(() => {
    let result = products;
    if (activeBrand) result = result.filter((p) => p.brand === activeBrand);
    if (activeModel) result = result.filter((p) => p.model === activeModel);
    return result;
  }, [activeBrand, activeModel]);

  const setBrand = (slug: string) => {
    if (slug === activeBrand) {
      searchParams.delete("marca");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ marca: slug });
    }
    setActiveModel("");
  };

  return (
    <main className="py-8">
      <div className="container">
        <h1 className="section-title mb-6">Catálogo de Peças</h1>

        {/* Brand filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {brands.map((brand) => (
            <button
              key={brand.slug}
              onClick={() => setBrand(brand.slug)}
              className={`rounded-md border px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-all ${
                activeBrand === brand.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {brand.icon} {brand.name}
            </button>
          ))}
        </div>

        {/* Model filters */}
        {currentBrand && (
          <div className="mb-6 flex flex-wrap gap-2">
            {currentBrand.models.map((model) => (
              <button
                key={model}
                onClick={() => setActiveModel(activeModel === model ? "" : model)}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeModel === model
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {model}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> produto(s) encontrado(s)
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewMode("grid")} className={`rounded-md p-2 ${viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`rounded-md p-2 ${viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Filter className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum produto encontrado para este filtro.</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-4"}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Catalog;
