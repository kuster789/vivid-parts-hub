import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Truck, MapPin, Clock, Package, CheckCircle, Calculator } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const EnvioNacional = () => (
  <main className="py-12">
    <div className="container max-w-4xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar ao início
      </Link>

      <ScrollReveal>
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Logística</span>
          <h1 className="section-title mb-4">Envio Nacional</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Entregamos para todo o Brasil com segurança, rastreamento em tempo real e as melhores
            transportadoras do mercado via integração com Melhor Envio.
          </p>
        </div>
      </ScrollReveal>

      {/* Features */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Truck, title: "Multi-transportadoras", desc: "PAC, SEDEX, Jadlog, Loggi e mais opções para você escolher." },
          { icon: MapPin, title: "Rastreamento", desc: "Acompanhe sua encomenda em tempo real pelo código de rastreio." },
          { icon: Clock, title: "Prazos Reais", desc: "Cálculo de prazo automático e atualizado diretamente com as transportadoras." },
          { icon: Package, title: "Embalagem Segura", desc: "Peças embaladas com proteção extra para evitar danos durante o transporte." },
        ].map(({ icon: Icon, title, desc }, idx) => (
          <ScrollReveal key={title} delay={idx * 100}>
            <div className="card-industrial group flex flex-col items-center p-6 text-center transition-all duration-300 hover:border-primary/40">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-[11px] font-bold uppercase tracking-wider text-foreground">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* How it works */}
      <ScrollReveal delay={200}>
        <div className="card-industrial p-8 mb-8">
          <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-foreground">Como funciona o envio</h2>
          <div className="space-y-5">
            {[
              { step: "1", title: "Cálculo automático", desc: "Informe seu CEP no checkout e veja todas as opções de frete com valores e prazos." },
              { step: "2", title: "Escolha a transportadora", desc: "Selecione a opção que melhor atende sua necessidade: mais rápido ou mais econômico." },
              { step: "3", title: "Embalagem e despacho", desc: "Sua encomenda é embalada com cuidado e despachada em até 24h úteis." },
              { step: "4", title: "Rastreie em tempo real", desc: "Receba o código de rastreamento e acompanhe cada etapa da entrega." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                  {step}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Tracking CTA */}
      <ScrollReveal delay={250}>
        <div className="card-industrial flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-foreground">Já fez uma compra?</h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe o status do seu pedido e veja onde sua encomenda está em tempo real.
            </p>
          </div>
          <Link to="/rastreamento" className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
            Rastrear Pedido <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={300}>
        <div className="mt-10 text-center">
          <Link to="/catalogo" className="btn-primary-glow inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold">
            Ver Catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </ScrollReveal>
    </div>
  </main>
);

export default EnvioNacional;
