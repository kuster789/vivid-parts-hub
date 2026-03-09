import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Ban, Package, Search, Loader2, ArrowUpDown, TrendingDown, BarChart3 } from "lucide-react";
import { brands } from "@/data/products";
import StockEditDialog from "./dashboard/StockEditDialog";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  model: string;
  sku: string | null;
  stock: number;
  price: number;
  active: boolean | null;
  images: string[] | null;
}

const LOW_STOCK_THRESHOLD = 5;

type StockFilter = "all" | "out_of_stock" | "low_stock" | "healthy";

const AdminStock = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<"stock_asc" | "stock_desc" | "name">("stock_asc");
  const [editProduct, setEditProduct] = useState<ProductRow | null>(null);
  const [editStock, setEditStock] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, brand, model, sku, stock, price, active, images")
      .order("stock", { ascending: true });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    let result = products;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q)
      );
    }

    if (filterBrand) {
      result = result.filter(p => p.brand?.toLowerCase() === filterBrand.toLowerCase());
    }

    if (stockFilter === "out_of_stock") result = result.filter(p => p.stock === 0);
    else if (stockFilter === "low_stock") result = result.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
    else if (stockFilter === "healthy") result = result.filter(p => p.stock > LOW_STOCK_THRESHOLD);

    if (sortBy === "stock_asc") result = [...result].sort((a, b) => a.stock - b.stock);
    else if (sortBy === "stock_desc") result = [...result].sort((a, b) => b.stock - a.stock);
    else result = [...result].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return result;
  }, [products, searchTerm, filterBrand, stockFilter, sortBy]);

  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const healthyCount = products.filter(p => p.stock > LOW_STOCK_THRESHOLD).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const openStockEditor = (product: ProductRow) => {
    setEditProduct(product);
    setEditStock(String(product.stock));
  };

  const saveStock = async () => {
    if (!editProduct) return;
    setSaving(true);
    await supabase.from("products").update({ stock: Number(editStock) }).eq("id", editProduct.id);
    setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...p, stock: Number(editStock) } : p));
    setEditProduct(null);
    setSaving(false);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive"><Ban className="h-3 w-3" />Esgotado</span>;
    if (stock <= LOW_STOCK_THRESHOLD) return <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500"><AlertTriangle className="h-3 w-3" />Baixo</span>;
    return <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500"><Package className="h-3 w-3" />OK</span>;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button onClick={() => setStockFilter("all")} className={`rounded-xl border p-4 text-left transition-all ${stockFilter === "all" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="h-4 w-4" /> Total de Produtos</div>
          <p className="mt-1 text-2xl font-bold text-foreground">{products.length}</p>
        </button>
        <button onClick={() => setStockFilter("out_of_stock")} className={`rounded-xl border p-4 text-left transition-all ${stockFilter === "out_of_stock" ? "border-destructive bg-destructive/5" : "border-border bg-card hover:border-destructive/40"}`}>
          <div className="flex items-center gap-2 text-xs text-destructive"><Ban className="h-4 w-4" /> Esgotados</div>
          <p className="mt-1 text-2xl font-bold text-destructive">{outOfStockCount}</p>
        </button>
        <button onClick={() => setStockFilter("low_stock")} className={`rounded-xl border p-4 text-left transition-all ${stockFilter === "low_stock" ? "border-amber-500 bg-amber-500/5" : "border-border bg-card hover:border-amber-500/40"}`}>
          <div className="flex items-center gap-2 text-xs text-amber-500"><AlertTriangle className="h-4 w-4" /> Estoque Baixo (≤{LOW_STOCK_THRESHOLD})</div>
          <p className="mt-1 text-2xl font-bold text-amber-500">{lowStockCount}</p>
        </button>
        <button onClick={() => setStockFilter("healthy")} className={`rounded-xl border p-4 text-left transition-all ${stockFilter === "healthy" ? "border-green-500 bg-green-500/5" : "border-border bg-card hover:border-green-500/40"}`}>
          <div className="flex items-center gap-2 text-xs text-green-500"><BarChart3 className="h-4 w-4" /> Estoque Saudável</div>
          <p className="mt-1 text-2xl font-bold text-green-500">{healthyCount}</p>
        </button>
      </div>

      {/* Inventory Value */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4" /> Valor Total em Estoque
          </div>
          <p className="text-lg font-bold text-foreground">
            R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, SKU, marca ou modelo..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Todas as marcas</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="stock_asc">Menor estoque</option>
          <option value="stock_desc">Maior estoque</option>
          <option value="name">Nome A-Z</option>
        </select>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {filtered.length} produto(s)
        </span>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Produto</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">SKU</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marca</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qtd</th>
              <th className="hidden px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">Valor Unit.</th>
              <th className="hidden px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">Valor Estoque</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className={`border-b border-border transition-colors hover:bg-secondary/30 ${p.stock === 0 ? "bg-destructive/5" : p.stock <= LOW_STOCK_THRESHOLD ? "bg-amber-500/5" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/40" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.model}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-xs font-medium text-foreground uppercase">{p.brand}</td>
                <td className="px-4 py-3 text-center">{getStockBadge(p.stock)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-bold ${p.stock === 0 ? "text-destructive" : p.stock <= LOW_STOCK_THRESHOLD ? "text-amber-500" : "text-foreground"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                  R$ {p.price.toFixed(2).replace(".", ",")}
                </td>
                <td className="hidden px-4 py-3 text-right text-xs font-medium text-foreground lg:table-cell">
                  R$ {(p.price * p.stock).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => openStockEditor(p)}
                    className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Edit Dialog */}
      {editProduct && (
        <StockEditDialog
          product={editProduct}
          stockValue={editStock}
          onStockChange={setEditStock}
          saving={saving}
          onSave={saveStock}
          onClose={() => setEditProduct(null)}
        />
      )}
    </div>
  );
};

export default AdminStock;
