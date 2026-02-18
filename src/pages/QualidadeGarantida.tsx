import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Shield, CheckCircle, Award, BadgeCheck, PackageCheck, RefreshCw } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useSEO } from "@/hooks/useSEO";

const QualidadeGarantida = () => {
  useSEO({
    title: "Qualidade Garantida — Peças Originais e Certificadas",
    description: "Todas as peças da Auto Peças Agrale passam por rigoroso controle de qualidade. Produtos originais para Agrale, Yamaha, Cagiva e KTM com garantia.",
    url: "/qualidade",
    type: "website",
  });

  return (
  <main className="py-12">
    <div className="container max-w-4xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar ao início
      </Link>

      <ScrollReveal>
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Compromisso</span>
          <h1 className="section-title mb-4">Qualidade Garantida</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Todas as peças comercializadas pela Auto Peças Agrale passam por rigoroso controle de qualidade.
            Trabalhamos exclusivamente com produtos originais e de alta durabilidade.
          </p>
        </div>
      </ScrollReveal>

      {/* Guarantees */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Shield, title: "Garantia de Fábrica", desc: "Todas as peças acompanham garantia do fabricante, assegurando a procedência e qualidade do produto." },
          { icon: BadgeCheck, title: "Peças Originais", desc: "Trabalhamos apenas com fornecedores homologados e peças originais de fábrica." },
          { icon: PackageCheck, title: "Embalagem Segura", desc: "Cada peça é embalada com cuidado para garantir que chegue em perfeitas condições." },
        ].map(({ icon: Icon, title, desc }, idx) => (
          <ScrollReveal key={title} delay={idx * 100}>
            <div className="card-industrial group flex flex-col items-center p-8 text-center transition-all duration-300 hover:border-primary/40">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 transition-transform group-hover:scale-110">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Process */}
      <ScrollReveal delay={200}>
        <div className="card-industrial p-8 mb-8">
          <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-foreground">Nosso Processo de Qualidade</h2>
          <div className="space-y-4">
            {[
              "Seleção criteriosa de fornecedores homologados",
              "Verificação de procedência e autenticidade de cada lote",
              "Inspeção visual e dimensional antes do armazenamento",
              "Embalagem protetora para transporte seguro",
              "Rastreabilidade completa do produto até o cliente final",
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Brands */}
      <ScrollReveal delay={250}>
        <div className="card-industrial p-8 mb-8">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Marcas que Trabalhamos</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Peças originais e de reposição para as principais marcas do segmento off-road e esportivo.
          </p>
          <div className="flex flex-wrap gap-3">
            {["Yamaha", "Agrale", "Cagiva", "KTM"].map((brand) => (
              <Link key={brand} to={`/catalogo?marca=${brand.toLowerCase()}`} className="rounded-lg border border-border bg-secondary px-4 py-2 font-display text-xs font-bold tracking-wider text-foreground transition-all hover:border-primary/40 hover:text-primary">
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Return policy */}
      <ScrollReveal delay={300}>
        <div className="card-industrial flex items-start gap-4 p-8">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">Política de Devolução</h2>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Não ficou satisfeito? Aceitamos devoluções dentro do prazo legal. Sua segurança na compra é nossa prioridade.
            </p>
            <Link to="/devolucao" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Ver política completa <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={350}>
        <div className="mt-10 text-center">
          <Link to="/catalogo" className="btn-primary-glow inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold">
            Explorar Catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  </main>
  );
};

export default QualidadeGarantida;
