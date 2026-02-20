import { useParams, Link } from "react-router-dom";
import { ArrowRight, Box } from "lucide-react";
import { useEffect, useState } from "react";
import { brands } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useSEO } from "@/hooks/useSEO";

const brandDescriptions: Record<string, string> = {
  agrale: "Peças originais e de reposição para motocicletas Agrale. Encontre virabrequins, cilindros, juntas, retentores e componentes para todos os modelos Agrale, desde o 13.5 até o Dakar 30.0 e Elefant.",
  yamaha: "Componentes técnicos para motocicletas Yamaha 2 tempos. Peças para RD 125, RD 135, RDZ, DT 180, DT 200 e RD 350 com qualidade e garantia.",
  cagiva: "Peças para motos Cagiva importadas. Componentes para Super City 125, Mito Evo, W8 e W16 com disponibilidade imediata.",
  ktm: "Peças para motocicletas KTM de alta performance. Escapamentos, componentes de motor e acessórios para KTM 950cc.",
};

const BrandPage = () => {
  const { slug } = useParams();
  const brand = brands.find((b) => b.slug === slug);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: brand ? `Peças para ${brand.name}` : "Marca não encontrada",
    description: brand ? brandDescriptions[brand.slug] || `Peças e componentes para motocicletas ${brand.name}. Envio para todo o Brasil.` : undefined,
    url: `/marca/${slug}`,
  });

  useEffect(() => {
    if (!brand) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .ilike("brand", brand.slug)
        .order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, [slug, brand]);

  if (!brand) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <Box className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Marca não encontrada.</p>
        <Link to="/catalogo" className="text-sm text-primary hover:underline">Voltar ao catálogo</Link>
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container">
        <Breadcrumbs items={[{ label: "Marcas", href: "/catalogo" }, { label: brand.name }]} />

        <ScrollReveal>
          <div className="mb-10 flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary p-3">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-4xl">{brand.icon}</span>
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-wide text-foreground md:text-4xl">
                Peças <span className="text-primary">{brand.name}</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {brandDescriptions[brand.slug]}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Models */}
        <ScrollReveal>
          <div className="mb-10">
            <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-widest text-primary">Modelos disponíveis</h2>
            <div className="flex flex-wrap gap-2">
              {brand.models.map((model) => (
                <Link
                  key={model}
                  to={`/catalogo?marca=${brand.slug}&modelo=${encodeURIComponent(model)}`}
                  className="rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {model}
                </Link>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Products */}
        <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-foreground">
          {loading ? "Carregando..." : `${products.length} produto${products.length !== 1 ? "s" : ""} encontrado${products.length !== 1 ? "s" : ""}`}
        </h2>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card/50 py-16">
            <Box className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="mb-2 text-muted-foreground">Nenhum produto cadastrado para {brand.name} ainda.</p>
            <Link to="/catalogo" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Ver catálogo completo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
};

export default BrandPage;
