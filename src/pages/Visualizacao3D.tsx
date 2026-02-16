import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, RotateCcw, ZoomIn, Smartphone, Monitor, MousePointer, Move } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const Visualizacao3D = () => (
  <main className="py-12">
    <div className="container max-w-4xl">
      {/* Breadcrumb */}
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar ao início
      </Link>

      <ScrollReveal>
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Tecnologia</span>
          <h1 className="section-title mb-4">Visualização 3D Interativa</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Inspecione cada peça com nossa tecnologia de visualização tridimensional antes de comprar.
            Gire, amplie e explore todos os detalhes como se estivesse segurando o componente nas mãos.
          </p>
        </div>
      </ScrollReveal>

      {/* Demo area */}
      <ScrollReveal delay={100}>
        <div className="card-industrial mb-10 overflow-hidden">
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-secondary to-background">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <RotateCcw className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "4s" }} />
              </div>
              <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Modelo 3D Interativo</p>
              <p className="mt-1 text-xs text-muted-foreground">Disponível em produtos selecionados</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal delay={150}>
        <h2 className="mb-6 font-display text-lg font-bold uppercase tracking-wider text-foreground">Como funciona</h2>
      </ScrollReveal>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MousePointer, title: "Clique e Arraste", desc: "Gire a peça em qualquer direção com o mouse ou toque." },
          { icon: ZoomIn, title: "Zoom", desc: "Use a roda do mouse ou gestos de pinça para aproximar detalhes." },
          { icon: Move, title: "Mover", desc: "Reposicione o modelo na tela com clique direito ou dois dedos." },
          { icon: RotateCcw, title: "Resetar", desc: "Volte à posição original a qualquer momento com um clique." },
        ].map(({ icon: Icon, title, desc }, idx) => (
          <ScrollReveal key={title} delay={idx * 100 + 200}>
            <div className="card-industrial group flex flex-col items-center p-6 text-center transition-all duration-300 hover:border-primary/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-[11px] font-bold uppercase tracking-wider text-foreground">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Compatibility */}
      <ScrollReveal delay={200}>
        <div className="card-industrial p-8">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Compatibilidade</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">Desktop</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Chrome, Firefox, Safari e Edge com suporte completo a WebGL. Mouse e teclado para controle total.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">Mobile</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Funciona em smartphones e tablets modernos. Use gestos de toque para rotacionar e zoom com pinça.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Formats */}
      <ScrollReveal delay={250}>
        <div className="mt-8 card-industrial p-8">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Formatos Suportados</h2>
          <div className="flex flex-wrap gap-3">
            {["GLB", "OBJ", "STL", "USDZ"].map((fmt) => (
              <span key={fmt} className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 font-display text-xs font-bold tracking-wider text-primary">
                {fmt}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Nossos modelos 3D são otimizados para carregamento rápido, mantendo alta fidelidade visual e precisão dimensional.
          </p>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={300}>
        <div className="mt-10 text-center">
          <Link to="/catalogo?3d=true" className="btn-primary-glow inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold">
            Ver Peças com 3D <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  </main>
);

export default Visualizacao3D;
