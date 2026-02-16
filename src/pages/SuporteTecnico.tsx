import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Wrench, MessageCircle, Phone, Mail, Clock, HelpCircle, Users, BookOpen } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const SuporteTecnico = () => (
  <main className="py-12">
    <div className="container max-w-4xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar ao início
      </Link>

      <ScrollReveal>
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Atendimento</span>
          <h1 className="section-title mb-4">Suporte Técnico</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Nossa equipe de especialistas está pronta para ajudar você a encontrar a peça certa para sua moto.
            Com anos de experiência no segmento, oferecemos orientação técnica personalizada.
          </p>
        </div>
      </ScrollReveal>

      {/* Services */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {[
          { icon: HelpCircle, title: "Identificação de Peças", desc: "Não sabe qual peça precisa? Envie fotos ou o número do chassi e identificamos para você.", color: "from-purple-500/20 to-violet-500/20" },
          { icon: Wrench, title: "Consultoria Técnica", desc: "Orientação sobre compatibilidade, instalação e manutenção preventiva para sua moto.", color: "from-amber-500/20 to-orange-500/20" },
          { icon: Users, title: "Atendimento Personalizado", desc: "Cada cliente recebe atenção individual. Entendemos sua necessidade antes de recomendar.", color: "from-blue-500/20 to-cyan-500/20" },
          { icon: BookOpen, title: "Base de Conhecimento", desc: "Acesse nosso blog com dicas, tutoriais e informações técnicas sobre manutenção de motos.", color: "from-emerald-500/20 to-green-500/20" },
        ].map(({ icon: Icon, title, desc, color }, idx) => (
          <ScrollReveal key={title} delay={idx * 100}>
            <div className="card-industrial group flex items-start gap-4 p-6 transition-all duration-300 hover:border-primary/40">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} transition-transform group-hover:scale-110`}>
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Contact channels */}
      <ScrollReveal delay={200}>
        <div className="card-industrial p-8 mb-8">
          <h2 className="mb-6 font-display text-sm font-bold uppercase tracking-wider text-foreground">Canais de Atendimento</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <a href="https://wa.me/5543964388230" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/50 p-5 text-center transition-all hover:border-primary/40 hover:bg-secondary">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                <p className="text-[11px] text-muted-foreground">+55 43 9643-8823</p>
              </div>
            </a>
            <a href="tel:+554396438823" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/50 p-5 text-center transition-all hover:border-primary/40 hover:bg-secondary">
              <Phone className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Telefone</p>
                <p className="text-[11px] text-muted-foreground">+55 43 9643-8823</p>
              </div>
            </a>
            <a href="mailto:autopecaagralecagiva@outlook.com" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/50 p-5 text-center transition-all hover:border-primary/40 hover:bg-secondary">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">E-mail</p>
                <p className="text-[11px] text-muted-foreground">autopecaagralecagiva@outlook.com</p>
              </div>
            </a>
          </div>
        </div>
      </ScrollReveal>

      {/* Hours */}
      <ScrollReveal delay={250}>
        <div className="card-industrial flex items-start gap-4 p-8">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">Horário de Atendimento</h2>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-medium text-foreground">Segunda a Sexta:</span> 8h às 18h</p>
              <p><span className="font-medium text-foreground">Sábado:</span> 8h às 12h</p>
              <p><span className="font-medium text-foreground">Domingo e Feriados:</span> Fechado</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={300}>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/suporte" className="btn-primary-glow inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold">
            Central de Ajuda <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/blog" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30">
            <BookOpen className="h-4 w-4" /> Blog Técnico
          </Link>
        </div>
      </ScrollReveal>
    </div>
  </main>
);

export default SuporteTecnico;
