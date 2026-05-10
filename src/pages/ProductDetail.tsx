import { useParams, Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { ArrowLeft, ShoppingCart, Package, CheckCircle, AlertTriangle, Loader2, Heart, Truck, Shield, RotateCcw, Bike, Box } from "lucide-react";
import { brands as brandsList } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductViewer3D from "@/components/ProductViewer3D";
import ColorSelector, { colorOptions } from "@/components/ColorSelector";
import ReviewSection from "@/components/ReviewSection";
import { useWishlist } from "@/hooks/useWishlist";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButtons from "@/components/ShareButtons";
import { trackEvent } from "@/utils/analytics";

const ProductDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isWished, toggle } = useWishlist();
  const [product, setProduct] = useState<Tables<"products"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [show3D, setShow3D] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Tables<"products">[]>([]);

  const { addProduct: trackView } = useRecentlyViewed();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      
      if (error) {
        console.error("Erro ao carregar produto:", error);
        toast.error("Erro ao carregar detalhes do produto.");
      }
      
      setProduct(data);
      setLoading(false);

      if (data) {
        trackEvent({
          event_type: "product_view",
          metadata: {
            product_id: data.id,
            product_name: data.name,
            brand: data.brand,
            price: Number(data.price),
            stock_status: data.stock > 0 ? "in_stock" : "out_of_stock",
          }
        });

        trackView({
          id: data.id,
          name: data.name,
          brand: data.brand,
          model: data.model,
          price: Number(data.price),
          image: data.images?.[0],
        });

        const { data: related } = await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .eq("brand", data.brand)
          .neq("id", data.id)
          .limit(4);
        setRelatedProducts(related || []);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id, trackView]);

  // SEO dinâmico — sempre chamado no topo (hooks não podem estar após early returns)
  useSEO({
    title: product?.name,
    description: product
      ? product.description || `${product.name} — peça para ${product.brand} ${product.model}. Compre com qualidade e envio para todo o Brasil.`
      : undefined,
    image: product?.images?.[0] ?? undefined,
    url: `/produto/${id}`,
    type: "product",
    price: product ? Number(product.price) : undefined,
    availability: product ? (product.stock > 0 ? "InStock" : "OutOfStock") : undefined,
    brand: product?.brand,
    sku: product?.sku ?? undefined,
  });

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

  const handleColorChange = (color: string) => {
    setSelectedColor(color === selectedColor ? "" : color);
    setSelectedVariations((prev) => ({ ...prev, Cor: color === selectedColor ? "" : color }));
  };

  const price = Number(product.price);
  const installment = (price / 12).toFixed(2).replace(".", ",");

  const getColorOverlayStyle = (colorName: string, imageUrl?: string): CSSProperties | undefined => {
    const selected = colorOptions.find((c) => c.name === colorName);
    if (!selected) return undefined;

    const mixBlendMode = colorName === "Preto" ? "multiply" : colorName === "Branco" ? "screen" : "color";
    const opacity = colorName === "Preto" ? 0.92 : colorName === "Branco" ? 0.9 : 0.8;

    return {
      backgroundColor: selected.hex,
      mixBlendMode,
      opacity,
      WebkitMaskImage: imageUrl ? `url("${imageUrl}")` : undefined,
      maskImage: imageUrl ? `url("${imageUrl}")` : undefined,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    };
  };

  return (
    <main className="py-8">
      <div className="container">
        <Breadcrumbs items={[
          { label: "Catálogo", href: "/catalogo" },
          { label: product.brand, href: `/catalogo?marca=${product.brand}` },
          { label: product.name },
        ]} />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image / 3D viewer */}
          <ScrollReveal direction="left">
            <div className="sticky top-24">
              {show3D && product.model_3d_url ? (
                <div className="space-y-3">
                  <ProductViewer3D modelUrl={product.model_3d_url} poster={product.images?.[0]} selectedColor={selectedColor} />
                  {(product.images && product.images.length > 0) && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      <button
                        onClick={() => setShow3D(true)}
                        className={`relative flex h-16 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border transition-all ${
                          show3D ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                        } bg-secondary`}
                      >
                        <Box className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-bold text-primary">3D</span>
                      </button>
                      {product.images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveImageIdx(idx);
                            setShow3D(false);
                          }}
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-all ${
                            !show3D && activeImageIdx === idx ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full bg-white object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : product.images && product.images.length > 0 ? (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-lg border border-border bg-white">
                    <div className="relative">
                      <img
                        src={product.images[activeImageIdx] || product.images[0]}
                        alt={product.name}
                        className="h-[400px] w-full object-contain transition-all duration-500 hover:scale-110 cursor-zoom-in md:h-[500px]"
                        loading="lazy"
                      />
                      {selectedColor && (
                        <div
                          className="pointer-events-none absolute inset-0 transition-all duration-500"
                           style={getColorOverlayStyle(
                             selectedColor,
                             product.images[activeImageIdx] || product.images[0],
                           )}
                        />
                      )}
                    </div>
                     {selectedColor && (
                       <div className="absolute bottom-3 left-3 rounded-full border border-border bg-card/90 px-3 py-1 backdrop-blur-sm">
                         <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                           <span className="inline-block h-3 w-3 rounded-full border border-border" style={{ backgroundColor: colorOptions.find((c) => c.name === selectedColor)?.hex }} />
                           {selectedColor}
                         </span>
                       </div>
                     )}
                    {product.has_3d && (
                      <button 
                        onClick={() => setShow3D(true)}
                        className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-display text-[10px] font-bold text-primary-foreground transition-transform hover:scale-105"
                      >
                        <Box className="h-3 w-3" /> VER EM 3D
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.has_3d && product.model_3d_url && (
                      <button
                        onClick={() => setShow3D(true)}
                        className={`relative flex h-16 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border transition-all ${
                          show3D ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                        } bg-secondary`}
                      >
                        <Box className="h-6 w-6 text-primary" />
                        <span className="text-[10px] font-bold text-primary">3D</span>
                      </button>
                    )}
                    {product.images.map((img: string, idx: number) => (
                       <button
                         key={idx}
                         onClick={() => {
                           setActiveImageIdx(idx);
                           setShow3D(false);
                         }}
                         className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-all ${
                           !show3D && activeImageIdx === idx ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                         }`}
                       >
                         <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full bg-white object-contain" />
                         {selectedColor && (
                           <div
                             className="pointer-events-none absolute inset-0"
                             style={getColorOverlayStyle(selectedColor, img)}
                           />
                         )}
                       </button>
                    ))}
                  </div>
                </div>
              ) : product.has_3d && product.model_3d_url ? (
                <ProductViewer3D modelUrl={product.model_3d_url} poster={product.images?.[0]} selectedColor={selectedColor} />
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-secondary md:h-[500px]">
                  <Package className="h-24 w-24 text-muted-foreground/20" />
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Product info */}
          <ScrollReveal direction="right">
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[11px] font-bold uppercase tracking-widest text-primary">
                    {product.brand?.toUpperCase()} · {product.model}
                  </span>
                  {product.condition === "usada" && (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Usado</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {user && (
                    <button onClick={() => toggle(product.id)} className="rounded-md p-2 transition-colors hover:bg-secondary" title="Favoritar">
                      <Heart className={`h-5 w-5 ${isWished(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  )}
                </div>
              </div>
              <h1 className="mb-3 font-display text-2xl font-bold uppercase tracking-wide text-foreground md:text-3xl">
                {product.name}
              </h1>

              <div className="mb-4">
                <ShareButtons
                  title={product.name}
                  description={product.description || `${product.name} — peça para ${product.brand} ${product.model}`}
                  url={`https://www.motopecasagrale.com.br/produto/${product.id}`}
                />
              </div>

              <div className="mb-4 flex flex-wrap gap-4 text-xs">
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

              {/* Price block */}
              <div className="mb-6 rounded-lg border border-border bg-card/50 p-4">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-black text-primary">
                    R$ {price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-muted-foreground">à vista</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ou 12x de <span className="font-semibold text-foreground">R$ {installment}</span> sem juros
                </p>
              </div>

              {hasColorVariation && (
                <ColorSelector selectedColor={selectedColor} onColorChange={handleColorChange} />
              )}

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

              {/* Quantity + Add to cart */}
              <div className="mt-auto border-t border-border pt-6">
                <div className="mb-4 flex items-center gap-3">
                  <label className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Qtd:</label>
                  <div className="flex items-center rounded-md border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >−</button>
                    <span className="min-w-[2rem] text-center text-sm font-medium text-foreground">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >+</button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                      addItem({ id: product.id, name: product.name, price, brand: product.brand, model: product.model, has_3d: product.has_3d ?? false, images: product.images, selectedColor }, selectedVariations);
                    }
                    toast.success(`${quantity}x ${product.name} adicionado(s) ao carrinho`);
                  }}
                  disabled={product.stock === 0}
                  className="btn-primary-glow flex w-full items-center justify-center gap-2 rounded-md py-3.5 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" /> Adicionar ao Carrinho
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: Truck, label: "Envio para todo Brasil" },
                  { icon: Shield, label: "Garantia de fábrica" },
                  { icon: RotateCcw, label: "Devolução em 7 dias" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/50 p-3 text-center">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-[10px] leading-tight text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Tabs: Description + Reviews */}
        <ScrollReveal className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent px-6 py-3 font-display text-xs uppercase tracking-wider data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
                Descrição
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent px-6 py-3 font-display text-xs uppercase tracking-wider data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none">
                Avaliações
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-6">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="text-sm leading-relaxed">{product.description || "Sem descrição disponível."}</p>
                {(variations.length > 0 || (Array.isArray(product.compatible_models) && product.compatible_models.length > 0)) && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Especificações</h3>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="bg-secondary/50 px-4 py-2.5 font-medium text-foreground">Marca</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{product.brand}</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="bg-secondary/50 px-4 py-2.5 font-medium text-foreground">Modelo</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{product.model}</td>
                          </tr>
                          {product.sku && (
                            <tr className="border-b border-border">
                              <td className="bg-secondary/50 px-4 py-2.5 font-medium text-foreground">SKU</td>
                              <td className="px-4 py-2.5 font-mono text-muted-foreground">{product.sku}</td>
                            </tr>
                          )}
                          {variations.map((v: any) => (
                            <tr key={v.name} className="border-b border-border last:border-0">
                              <td className="bg-secondary/50 px-4 py-2.5 font-medium text-foreground">{v.name}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{(v.options || []).join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Compatible models section */}
                {Array.isArray(product.compatible_models) && product.compatible_models.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      <Bike className="h-4 w-4 text-primary" />
                      Compatibilidade
                    </h3>
                    <p className="mb-3 text-xs text-muted-foreground">Esta peça também é compatível com os seguintes modelos:</p>
                    <div className="flex flex-wrap gap-2">
                      {(product.compatible_models as { brand: string; model: string }[]).map((cm, i) => (
                        <Link
                          key={i}
                          to={`/catalogo?marca=${cm.brand}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <span className="font-bold text-primary">{brandsList.find(b => b.slug === cm.brand)?.name || cm.brand.toUpperCase()}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{cm.model}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <ReviewSection productId={product.id} />
            </TabsContent>
          </Tabs>
        </ScrollReveal>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <ScrollReveal className="mt-16">
            <div className="mb-6">
              <span className="mb-1 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Você também pode gostar</span>
              <h2 className="section-title text-xl">Produtos Relacionados</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/produto/${p.id}`} className="card-industrial group overflow-hidden transition-all duration-300 hover:border-primary/40">
                  <div className="relative h-40 bg-secondary">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/20" /></div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.brand} · {p.model}</p>
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="mt-1 font-display text-sm font-bold text-primary">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    </main>
  );
};

export default ProductDetail;
