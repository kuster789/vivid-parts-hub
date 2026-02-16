import { Link } from "react-router-dom";
import { ArrowRight, Box, Shield, Truck, Headphones, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import ProductCard from "@/components/ProductCard";
import { brands } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("*").eq("active", true).limit(4);
      setFeatured(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Peças automotivas de alta qualidade" className="h-full w-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        </div>
        <div className="container relative z-10 py-20">
          <div className="max-w-xl animate-fade-in">
            <span className="mb-4 inline-block rounded-sm bg-primary/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-widest text-primary">
              Peças de alta performance
            </span>
            <h1 className="mb-4 font-display text-4xl font-black uppercase leading-tight tracking-wide text-foreground md:text-5xl lg:text-6xl">
              Auto Peças <span className="text-gradient">Agrale</span>
            </h1>
            <p className="mb-8 max-w-md font-body text-base text-muted-foreground md:text-lg">
              Peças e componentes técnicos para motocicletas clássicas e esportivas. Qualidade profissional com visualização 3D interativa.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo" className="btn-primary-glow inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm transition-all">
                Ver Catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/suporte" className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="border-y border-border bg-card py-16">
        <div className="container">
          <h2 className="section-title mb-8 text-center">Nossas Marcas</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                to={`/catalogo?marca=${brand.slug}`}
                className="card-industrial flex flex-col items-center gap-3 p-6 transition-all hover:border-primary/40 hover:scale-[1.02]"
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-12 w-auto object-contain" />
                ) : (
                  <span className="text-3xl">{brand.icon}</span>
                )}
                <span className="font-display text-sm font-bold tracking-wider text-foreground">{brand.name}</span>
                <span className="text-xs text-muted-foreground">{brand.models.length} modelos</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="section-title">Destaques</h2>
            <Link to="/catalogo" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card py-16">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { icon: Box, title: "Visualização 3D", desc: "Veja peças em 3D interativo antes de comprar" },
              { icon: Shield, title: "Qualidade Garantida", desc: "Todas as peças com garantia de fábrica" },
              { icon: Truck, title: "Envio Rápido", desc: "Entrega para todo o Brasil com rastreamento" },
              { icon: Headphones, title: "Suporte Técnico", desc: "Equipe especializada para te ajudar" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 rounded-lg p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-display text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
