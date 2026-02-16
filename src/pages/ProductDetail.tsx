import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Package, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductViewer3D from "@/components/ProductViewer3D";
import ColorSelector, { colorOptions } from "@/components/ColorSelector";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);

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
  const hasColorVariation = variations.some((v: any) => v.name?.toLowerCase() === "cor");
  const colorFilter = selectedColor
    ? colorOptions.find((c) => c.name === selectedColor)?.filter || ""
    : "";

  const handleColorChange = (color: string) => {
    setSelectedColor(color === selectedColor ? "" : color);
    setSelectedVariations((prev) => ({ ...prev, Cor: color === selectedColor ? "" : color }));
  };

  return (
    <main className="py-8">
      <div className="container">
        <Link to="/catalogo" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image / 3D viewer */}
          <div>
            {product.has_3d && product.model_3d_url ? (
              <ProductViewer3D />
            ) : product.images && product.images.length > 0 ? (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img
                    src={product.images[activeImageIdx] || product.images[0]}
                    alt={product.name}
                    className="h-[400px] w-full object-cover transition-all duration-500 md:h-[500px]"
                    style={colorFilter ? { filter: colorFilter } : undefined}
                  />
                  {selectedColor && (
                    <div className="absolute bottom-3 left-3 rounded-full border border-border bg-card/90 px-3 py-1 backdrop-blur-sm">
                      <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: colorOptions.find((c) => c.name === selectedColor)?.hex }}
                        />
                        {selectedColor}
                      </span>
                    </div>
                  )}
                </div>
                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2">
                    {product.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-all ${
                          activeImageIdx === idx ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${idx + 1}`}
                          className="h-full w-full object-cover"
                          style={colorFilter ? { filter: colorFilter } : undefined}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-secondary md:h-[500px]">
                <Package className="h-24 w-24 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Product info */}
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

            {/* Color selector */}
            <ColorSelector selectedColor={selectedColor} onColorChange={handleColorChange} />

            {/* Other variations */}
            {variations
              .filter((v: any) => v.name?.toLowerCase() !== "cor")
              .map((v: any) => (
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
                onClick={() => addItem({ id: product.id, name: product.name, price: Number(product.price), brand: product.brand, model: product.model, has_3d: product.has_3d ?? false }, selectedVariations)}
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
