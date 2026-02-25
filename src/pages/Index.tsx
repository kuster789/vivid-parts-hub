import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Box, Shield, Truck, Headphones, Star, Wrench, Zap } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import heroBanner from "@/assets/hero-banner-agrale.png";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { brands } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import FAQSection from "@/components/FAQSection";
import RecentlyViewed from "@/components/RecentlyViewed";


const Counter = ({ end, suffix = "", label }: {end: number;suffix?: string;label: string;}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated || end === 0) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(end / (duration / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); } else
      setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [hasAnimated, end]);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-lg font-black text-primary sm:text-2xl md:text-3xl">{count.toLocaleString("pt-BR")}{suffix}</p>
      <p className="text-[9px] font-medium uppercase tracking-wider text-[hsl(215,10%,55%)] sm:text-[11px]">{label}</p>
    </div>);
};

const Index = () => {
  useSEO({
    title: "Peças para Agrale, Yamaha, Cagiva e KTM",
    description: "Especialistas em peças para Agrale, Yamaha, Cagiva e KTM. Componentes originais e de qualidade com envio para todo o Brasil. Encontre virabrequins, carburadores, cilindros e muito mais.",
    url: "/"
  });
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data }, { count }] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).limit(4),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true)]
      );
      setFeatured(data || []);
      setProductCount(count || 0);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-center overflow-hidden md:min-h-[80vh] text-[hsl(210,15%,92%)]">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Peças automotivas de alta qualidade" className="h-full w-full object-cover" loading="eager" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,20%,6%)] via-[hsl(220,20%,6%,0.9)] to-[hsl(220,20%,6%,0.3)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,20%,6%,0.8)] via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 py-10 md:py-20">
          <div className="max-w-2xl animate-fade-in">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-primary md:mb-6 md:px-4 md:py-1.5 md:text-[11px]">
              <Zap className="h-3 w-3" /> Peças de alta performance
            </span>
            <h1 className="mb-4 font-display text-3xl font-black uppercase leading-[1.1] tracking-wide text-[hsl(210,15%,92%)] sm:text-4xl md:mb-6 md:text-6xl lg:text-7xl">
              Auto Peças <br /><span className="text-gradient">Agrale</span>
            </h1>
            <p className="mb-6 max-w-lg font-body text-sm leading-relaxed text-[hsl(215,10%,55%)] md:mb-8 md:text-lg">
              Peças e componentes técnicos para motocicletas clássicas e esportivas.
              Qualidade profissional com <span className="font-semibold text-[hsl(210,15%,92%)]">visualização 3D interativa</span>.
            </p>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row md:mb-12">
              <Link to="/catalogo" className="btn-primary-glow inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all md:px-8 md:py-3.5">
                Ver Catálogo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/suporte" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[hsl(220,12%,16%)] bg-[hsl(220,18%,10%,0.5)] px-6 py-3 text-sm font-medium text-[hsl(210,15%,92%)] backdrop-blur-sm transition-colors hover:bg-[hsl(220,15%,14%)] hover:border-primary/30 md:px-8 md:py-3.5">
                <Headphones className="h-4 w-4" /> Suporte
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 border-t border-[hsl(220,12%,16%,0.5)] pt-6 md:flex md:gap-12 md:pt-8">
              <Counter end={productCount} suffix="+" label="Peças" />
              <Counter end={4} label="Marcas" />
              <Counter end={21} suffix="+" label="Modelos" />
              <Counter end={5} suffix="★" label="Avaliação" />
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="border-y border-border bg-card/50 py-10 md:py-20">
        <div className="container">
          <ScrollReveal>
            <div className="mb-6 text-center md:mb-10">
              <span className="mb-2 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Especialistas</span>
              <h2 className="section-title text-xl md:text-3xl">Nossas Marcas</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {brands.map((brand, idx) =>
            <ScrollReveal key={brand.slug} delay={idx * 100}>
                <Link
                to={`/catalogo?marca=${brand.slug}`}
                className="card-industrial group relative flex flex-col items-center gap-3 overflow-hidden p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 md:gap-4 md:p-8">

                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-secondary/80 p-2 transition-transform duration-300 group-hover:scale-110">
                    {brand.logo ?
                  <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain" /> :

                  <span className="text-3xl">{brand.icon}</span>
                  }
                  </div>
                  <div className="relative text-center">
                    <span className="block font-display text-sm font-bold tracking-wider text-foreground">{brand.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{brand.models.length} modelos</span>
                  </div>
                  <ArrowRight className="relative h-4 w-4 text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                </Link>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 md:py-20">
        <div className="container">
          <ScrollReveal>
          <div className="mb-6 flex items-end justify-between md:mb-10">
            <div>
              <span className="mb-2 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Catálogo</span>
              <h2 className="section-title text-xl md:text-3xl">Destaques</h2>
            </div>
            <Link to="/catalogo" className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-primary md:px-4 md:py-2 md:text-sm">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          </ScrollReveal>
          {loading ?
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div> :

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) =>
            <ProductCard key={product.id} product={product} />
            )}
            </div>
          }
        </div>
      </section>

      {/* Features / Benefits */}
      <section className="border-t border-border bg-card/50 py-10 md:py-20">
        <div className="container">
          <ScrollReveal>
            <div className="mb-8 text-center md:mb-12">
              <span className="mb-2 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Por que nos escolher</span>
              <h2 className="section-title text-xl md:text-3xl">Qualidade e Confiança</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
            {[
            { icon: Box, title: "Visualização 3D", desc: "Veja peças em 3D interativo antes de comprar. Gire, amplie e inspecione cada detalhe.", color: "from-amber-500/20 to-orange-500/20", link: "/visualizacao-3d" },
            { icon: Shield, title: "Qualidade Garantida", desc: "Todas as peças com garantia de fábrica. Produtos originais e de alta durabilidade.", color: "from-emerald-500/20 to-green-500/20", link: "/qualidade" },
            { icon: Truck, title: "Envio Nacional", desc: "Entrega para todo o Brasil com rastreamento em tempo real via Melhor Envio.", color: "from-blue-500/20 to-cyan-500/20", link: "/envio" },
            { icon: Wrench, title: "Suporte Técnico", desc: "Equipe especializada para auxiliar na escolha da peça certa para sua moto.", color: "from-purple-500/20 to-violet-500/20", link: "/suporte-tecnico" }].
            map(({ icon: Icon, title, desc, color, link }, idx) =>
            <ScrollReveal key={title} delay={idx * 120}>
              <Link to={link} className="card-industrial group flex flex-col items-center p-4 text-center transition-all duration-300 hover:border-primary/40 cursor-pointer md:p-8">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} transition-transform duration-300 group-hover:scale-110 md:mb-5 md:h-14 md:w-14`}>
                  <Icon className="h-5 w-5 text-primary md:h-7 md:w-7" />
                </div>
                <h3 className="mb-1 font-display text-[10px] font-bold uppercase tracking-wider text-foreground md:mb-2 md:text-xs">{title}</h3>
                <p className="hidden text-xs leading-relaxed text-muted-foreground sm:block">{desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Saiba mais <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="border-t border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-10 md:py-16">
        <ScrollReveal direction="left">
        <div className="container flex flex-col items-center gap-4 text-center md:flex-row md:gap-6 md:text-left">
          <div className="flex-1">
            <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-foreground md:text-2xl">
              Não encontrou a peça que precisa?
            </h2>
            <p className="text-sm text-muted-foreground">
              Entre em contato com nosso suporte técnico. Temos uma rede de fornecedores para encontrar o que você precisa.
            </p>
          </div>
          <Link to="/suporte" className="btn-primary-glow inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-8 py-3.5 text-sm font-semibold">
            Fale Conosco <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        </ScrollReveal>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* FAQ */}
      <FAQSection />
    </main>);

};

export default Index;