import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Package, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductViewer3D from "@/components/ProductViewer3D";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      setProduct(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center">
        <Package className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Produto não encontrado.</p>
        <Link to="/catalogo" className="text-sm text-primary hover:underline">Voltar ao catálogo</Link>
      </div>
    );
  }

  const variations = Array.isArray(product.variations) ? product.variations : [];

  return (
    <main className="py-8">
      <div className="container">
        <Link to="/catalogo" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            {product.has_3d ? (
              <ProductViewer3D />
            ) : product.images && product.images.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <img src={product.images[0]} alt={product.name} className="h-[400px] w-full object-cover md:h-[500px]" />
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-secondary md:h-[500px]">
                <Package className="h-24 w-24 text-muted-foreground/20" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="mb-2 font-display text-[11px] font-bold uppercase tracking-widest text-primary">
              {product.brand?.toUpperCase()} · {product.model}
            </span>
            <h1 className="mb-3 font-display text-2xl font-bold uppercase tracking-wide text-foreground md:text-3xl">
              {product.name}
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mb-6 flex flex-wrap gap-4 text-xs">
              <span className="text-muted-foreground">SKU: <span className="font-mono text-foreground">{product.sku}</span></span>
              <span className="flex items-center gap-1">
                {product.stock > 5 ? (
                  <><CheckCircle className="h-3.5 w-3.5 text-success" /> <span className="text-success">Em estoque ({product.stock})</span></>
                ) : product.stock > 0 ? (
                  <><AlertTriangle className="h-3.5 w-3.5 text-primary" /> <span className="text-primary">Últimas {product.stock} unidades</span></>
                ) : (
                  <span className="text-destructive">Indisponível</span>
                )}
              </span>
            </div>

            {variations.map((v: any) => (
              <div key={v.name} className="mb-4">
                <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-foreground">{v.name}</label>
                <div className="flex flex-wrap gap-2">
                  {(v.options || []).map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => setSelectedVariations({ ...selectedVariations, [v.name]: opt })}
                      className={`rounded-md border px-4 py-2 text-xs font-medium transition-all ${
                        selectedVariations[v.name] === opt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-auto border-t border-border pt-6">
              <div className="mb-4 flex items-baseline gap-2">
                <span className="font-display text-3xl font-black text-primary">
                  R$ {Number(product.price).toFixed(2).replace(".", ",")}
                </span>
                <span className="text-xs text-muted-foreground">à vista</span>
              </div>
              <button
                onClick={() => addItem({ id: product.id, name: product.name, price: Number(product.price), brand: product.brand, model: product.model }, selectedVariations)}
                disabled={product.stock === 0}
                className="btn-primary-glow flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm transition-all disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" /> Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
