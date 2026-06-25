import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Grid3X3, List, Loader2, ArrowUpDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import CatalogSidebar, { CatalogMobileFilters } from "@/components/CatalogSidebar";
import { brands } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import type { Tables } from "@/integrations/supabase/types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBrand = searchParams.get("marca") || "";
  const activeModel = searchParams.get("modelo") || "";
  const priceMin = Number(searchParams.get("preco_min")) || 0;
  const priceMax = Number(searchParams.get("preco_max")) || 0;
  const inStock = searchParams.get("em_estoque") === "1";
  const has3D = searchParams.get("has_3d") === "1";
  const condition = searchParams.get("condicao") || "";

  const brandLabel = activeBrand ? activeBrand.charAt(0).toUpperCase() + activeBrand.slice(1) : "";
  useSEO({
    title: activeBrand
      ? `Peças para ${brandLabel}${activeModel ? ` ${activeModel}` : ""}`
      : "Catálogo de Peças",
    description: activeBrand
      ? `Encontre peças para ${brandLabel}${activeModel ? ` ${activeModel}` : ""}: cilindros, carburadores, virabrequins e mais. Envio para todo o Brasil.`
      : "Catálogo completo de peças para motos Agrale, Yamaha, Cagiva e KTM. Filtros por marca, modelo e categoria.",
    url: "/catalogo",
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 12;
  const currentPage = Number(searchParams.get("pagina")) || 1;

  const currentBrand = brands.find((b) => b.slug === activeBrand);
  const catalogHeading = currentBrand
    ? `Peças para ${currentBrand.name}${activeModel ? ` ${activeModel}` : ""}`
    : "Catálogo de Peças";

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
    const load = async () => {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const needsCompatFilter = !!(activeBrand);

      if (needsCompatFilter) {
        // Use RPC function that handles compatible_models filtering
        const { data: allFiltered } = await supabase.rpc("filter_products_by_compatibility", {
          _brand: activeBrand || null,
          _model: activeModel || null,
        });

        let filtered = (allFiltered || []) as Tables<"products">[];

        // Apply additional client-side filters
        if (priceMin > 0) filtered = filtered.filter(p => p.price >= priceMin);
        if (priceMax > 0) filtered = filtered.filter(p => p.price <= priceMax);
        if (inStock) filtered = filtered.filter(p => p.stock > 0);
        if (has3D) filtered = filtered.filter(p => p.has_3d === true);
        if (condition) filtered = filtered.filter(p => p.condition === condition);
        

        // Sort
        if (sortBy === "price_asc") filtered.sort((a, b) => a.price - b.price);
        else if (sortBy === "price_desc") filtered.sort((a, b) => b.price - a.price);
        else if (sortBy === "name") filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        else filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setTotalCount(filtered.length);
        setProducts(filtered.slice(from, to + 1));
      } else {
        // No brand filter: use standard query
        let countQuery = supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true);
        if (priceMin > 0) countQuery = countQuery.gte("price", priceMin);
        if (priceMax > 0) countQuery = countQuery.lte("price", priceMax);
        if (inStock) countQuery = countQuery.gt("stock", 0);
        if (has3D) countQuery = countQuery.eq("has_3d", true);
        if (condition) countQuery = countQuery.eq("condition", condition);
        const { count } = await countQuery;
        setTotalCount(count || 0);

        let query = supabase.from("products").select("*").eq("active", true);
        if (priceMin > 0) query = query.gte("price", priceMin);
        if (priceMax > 0) query = query.lte("price", priceMax);
        if (inStock) query = query.gt("stock", 0);
        if (has3D) query = query.eq("has_3d", true);
        if (condition) query = query.eq("condition", condition);
        
        if (sortBy === "price_asc") query = query.order("price", { ascending: true });
        else if (sortBy === "price_desc") query = query.order("price", { ascending: false });
        else if (sortBy === "name") query = query.order("name", { ascending: true });
        else query = query.order("created_at", { ascending: false });
        
        query = query.range(from, to);

        const { data } = await query;
        setProducts(data || []);
      }

      setLoading(false);
    };
    load();
    }, 150);
    return () => clearTimeout(debounceTimer);
  }, [activeBrand, activeModel, sortBy, currentPage, priceMin, priceMax, inStock, has3D, condition]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) params.delete("pagina");
    else params.set("pagina", String(page));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const setBrand = (slug: string) => {
    if (slug === activeBrand) {
      searchParams.delete("marca");
      searchParams.delete("modelo");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ marca: slug });
    }
  };

  return (
    <main className="py-6 md:py-8">
      <div className="container">
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <h1 className="section-title text-lg md:text-2xl">{catalogHeading}</h1>
          <CatalogMobileFilters />
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar - visible on large screens */}
          <CatalogSidebar />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile brand pills - hidden on lg since sidebar handles it */}
            <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
              {brands.map((brand) => (
                <button
                  key={brand.slug}
                  onClick={() => setBrand(brand.slug)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeBrand === brand.slug
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="h-4 w-auto object-contain" />
                  ) : (
                    <span className="text-xs">{brand.icon}</span>
                  )}
                  {brand.name}
                </button>
              ))}
            </div>

            {/* Mobile model filter */}
            {currentBrand && (
              <div className="mb-4 flex flex-wrap gap-1.5 lg:hidden">
                {currentBrand.models.map((model) => (
                  <button
                    key={model}
                    onClick={() => {
                      if (activeModel === model) {
                        setSearchParams({ marca: activeBrand });
                      } else {
                        setSearchParams({ marca: activeBrand, modelo: model });
                      }
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
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
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3 md:mb-6 md:pb-4">
              <span className="text-xs text-muted-foreground md:text-sm">
                <span className="font-semibold text-foreground">{totalCount}</span> produto(s)
                {activeBrand && currentBrand && (
                  <span className="hidden sm:inline"> em <span className="font-medium text-foreground">{currentBrand.name}</span></span>
                )}
                {activeModel && (
                  <span className="hidden sm:inline"> · <span className="font-medium text-foreground">{activeModel}</span></span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-md border border-border bg-secondary px-2 py-1.5 text-[11px] text-foreground focus:border-primary focus:outline-none md:px-3 md:text-xs"
                >
                  <option value="newest">Recentes</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="name">A-Z</option>
                </select>
                <div className="hidden items-center gap-1 sm:flex">
                  <button onClick={() => setViewMode("grid")} className={`rounded-md p-2 ${viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`rounded-md p-2 ${viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Filter className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, i) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => goToPage(page)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Catalog;
