import { Link } from "react-router-dom";
import { Wrench, ArrowRight, ShoppingCart } from "lucide-react";
import { brands } from "@/data/products";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useSEO } from "@/hooks/useSEO";

const kits = [
  {
    brand: "agrale",
    model: "Agrale 27.5",
    title: "Kit Revisão Motor Agrale 27.5",
    items: ["Junta do cabeçote", "Junta do cilindro", "Retentores do motor", "Anéis de compressão", "Rolamentos"],
    savings: 15,
  },
  {
    brand: "agrale",
    model: "Agrale Dakar 30.0",
    title: "Kit Revisão Completa Dakar 30.0",
    items: ["Junta do cabeçote", "Junta do cilindro", "Retentores", "Anéis", "Válvula palheta", "Rolamentos"],
    savings: 20,
  },
  {
    brand: "agrale",
    model: "Agrale 16.5",
    title: "Kit Motor Agrale 16.5 / Elefant",
    items: ["Retentores do motor", "Juntas completas", "Anéis de compressão", "Pastilhas de freio"],
    savings: 12,
  },
  {
    brand: "yamaha",
    model: "RD 135",
    title: "Kit Revisão Motor RD/RDZ 135",
    items: ["Pistão completo", "Anéis de compressão", "Juntas do motor", "Rolamentos do motor"],
    savings: 18,
  },
  {
    brand: "yamaha",
    model: "DT 180",
    title: "Kit Revisão DT 180",
    items: ["Carburador completo", "Juntas", "Pistão", "Anéis", "Rolamentos"],
    savings: 15,
  },
  {
    brand: "yamaha",
    model: "RD 350",
    title: "Kit Performance RD 350",
    items: ["CDI programável", "Juntas do cabeçote", "Pistões (par)", "Anéis de compressão"],
    savings: 22,
  },
  {
    brand: "cagiva",
    model: "Super City 125",
    title: "Kit Revisão Super City 125",
    items: ["Embreagem completa", "Câmbio", "Juntas", "Retentores"],
    savings: 10,
  },
  {
    brand: "cagiva",
    model: "Mito",
    title: "Kit Embreagem Cagiva Mito",
    items: ["Discos de fricção", "Discos separadores", "Molas reforçadas", "Retentores"],
    savings: 12,
  },
];

const KitsRevisao = () => {
  useSEO({
    title: "Kits de Revisão por Modelo",
    description: "Kits completos de revisão para motocicletas Agrale, Yamaha e Cagiva. Economize até 22% comprando peças em pacote. Tudo que você precisa para a revisão da sua moto.",
    url: "/kits-revisao",
  });

  return (
    <main className="py-8">
      <div className="container">
        <Breadcrumbs items={[{ label: "Kits de Revisão" }]} />

        <ScrollReveal>
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Wrench className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-3 font-display text-3xl font-black uppercase tracking-wide text-foreground md:text-4xl">
              Kits de <span className="text-primary">Revisão</span>
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
              Pacotes de peças organizados por modelo de moto. Compre o kit completo e economize no valor total.
              Todas as peças que você precisa para a revisão em um só lugar.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit, idx) => {
            const brand = brands.find((b) => b.slug === kit.brand);
            return (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div className="card-industrial flex h-full flex-col p-6 transition-all hover:border-primary/40">
                  <div className="mb-4 flex items-center gap-3">
                    {brand?.logo && (
                      <img src={brand.logo} alt={brand.name} className="h-8 w-8 object-contain" />
                    )}
                    <div>
                      <span className="font-display text-[10px] font-bold uppercase tracking-widest text-primary">
                        {brand?.name}
                      </span>
                      <span className="ml-2 text-[10px] text-muted-foreground">· {kit.model}</span>
                    </div>
                    <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                      -{kit.savings}%
                    </span>
                  </div>

                  <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    {kit.title}
                  </h3>

                  <ul className="mb-4 flex-1 space-y-1.5">
                    {kit.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={`/catalogo?marca=${kit.brand}&modelo=${encodeURIComponent(kit.model)}`}
                    className="btn-primary-glow flex items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Ver Peças do Kit
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA */}
        <ScrollReveal>
          <div className="mt-12 rounded-xl border border-border bg-card/50 p-8 text-center">
            <h2 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-foreground">
              Precisa de um kit personalizado?
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Monte seu próprio kit de revisão. Nosso suporte técnico ajuda a selecionar as peças certas para sua moto.
            </p>
            <Link to="/suporte" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Falar com suporte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
};

export default KitsRevisao;
