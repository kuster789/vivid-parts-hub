import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, BookOpen, Wrench, Settings, Search, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useSEO } from "@/hooks/useSEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ManualItem {
  title: string;
  description: string;
  blogSlug: string;
  category: "manual" | "catalogo" | "tutorial" | "revista";
  brand: string;
  models: string[];
  icon: typeof FileText;
  year?: string;
  coverImage?: string;
}

const manuals: ManualItem[] = [
  {
    title: "Manual de Oficina — Motocicletas Agrale",
    description: "Manual técnico completo com especificações, desmontagem/montagem de motor, embreagem, câmbio, sistema elétrico, freios e suspensão.",
    blogSlug: "manual-oficina-motocicletas-agrale",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5"],
    icon: Wrench,
    year: "1991",
    coverImage: "/blog/manutencao-agrale-cover.jpg",
  },
  {
    title: "Manual do Proprietário — Agrale 27.5 e Dakar 30.0",
    description: "Guia completo do proprietário cobrindo segurança, comandos, pilotagem, manutenção, carburador, filtros, freios, suspensão e sistema elétrico.",
    blogSlug: "manual-proprietario-agrale-275-dakar-30",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale 27.5 E", "Agrale Dakar 30.0"],
    icon: BookOpen,
    coverImage: "/blog/motor-agrale-2tempos-cover.jpg",
  },
  {
    title: "Limpeza e Regulagem — Carburadores Dellorto PHBL-25",
    description: "Tutorial passo-a-passo com fotos para limpeza e regulagem do carburador Dellorto PHBL-25.",
    blogSlug: "limpeza-regulagem-carburador-dellorto",
    category: "tutorial",
    brand: "Agrale",
    models: ["Agrale 27.5 E", "Agrale 27.5 EX", "Agrale Dakar 30.0"],
    icon: Wrench,
    coverImage: "/blog/carburador-dellorto-cover.jpg",
  },
  {
    title: "Catálogo de Peças Agrale",
    description: "Catálogo oficial com referências de peças, códigos e ilustrações explodidas dos conjuntos mecânicos.",
    blogSlug: "como-usar-catalogo-pecas-agrale",
    category: "catalogo",
    brand: "Agrale",
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5", "Agrale Dakar 30.0"],
    icon: FileText,
    coverImage: "/blog/catalogo-pecas-intro.jpg",
  },
  {
    title: "Esquema Elétrico — Agrale Elefantre",
    description: "Guia prático para leitura e interpretação do esquema elétrico da Agrale Elefantre com mapeamento de componentes.",
    blogSlug: "esquema-eletrico-agrale-elefantre-guia",
    category: "tutorial",
    brand: "Agrale",
    models: ["Agrale Elefantre"],
    icon: Settings,
    coverImage: "/blog/esquema-eletrico-elefantre.png",
  },
  {
    title: "Especificações do Motor Agrale 2 Tempos",
    description: "Tudo sobre o motor monocilíndrico 2 tempos que equipa as motocicletas Agrale: especificações técnicas completas.",
    blogSlug: "especificacoes-motor-agrale-2-tempos",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5"],
    icon: Wrench,
    coverImage: "/blog/motor-agrale-2tempos-cover.jpg",
  },
  {
    title: "Manutenção Periódica — Agrale 27.5 e Dakar 30.0",
    description: "Tabela de manutenção periódica com intervalos, procedimentos e dicas para manter sua Agrale em perfeito estado.",
    blogSlug: "manutencao-periodica-agrale-27-5-dakar-30",
    category: "tutorial",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale Dakar 30.0"],
    icon: Settings,
    coverImage: "/blog/manutencao-agrale-cover.jpg",
  },
  {
    title: "Revista Moto 4 Rodas Nº 34 — RD 350 LC vs CB 450",
    description: "Edição histórica com comparativo Yamaha RD 350 LC vs Honda CB 450 Esporte. Conteúdo clássico do motociclismo brasileiro.",
    blogSlug: "yamaha-rd350-lc-vs-honda-cb450-comparativo-1984",
    category: "revista",
    brand: "Yamaha",
    models: ["RD 350"],
    icon: BookOpen,
    year: "1984",
    coverImage: "/blog/rd350-vs-cb450-teste.jpg",
  },
  {
    title: "Guia de Retentores Agrale — Códigos Sabó",
    description: "Guia completo de retentores com códigos Sabó, dimensões e especificações de materiais para motocicletas Agrale.",
    blogSlug: "guia-retentores-agrale-sabo",
    category: "catalogo",
    brand: "Agrale",
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5"],
    icon: FileText,
    coverImage: "/blog/catalogo-pecas-motor.jpg",
  },
  {
    title: "Tabela de Resistência de Bobinas",
    description: "Guia de diagnóstico elétrico com valores de resistência de bobinas para Agrale, Yamaha e Honda.",
    blogSlug: "tabela-resistencia-bobinas-motos",
    category: "tutorial",
    brand: "Agrale",
    models: ["Agrale", "Yamaha", "Honda"],
    icon: Settings,
  },
];

const categoryConfig: Record<string, { label: string; color: string; description: string }> = {
  manual: {
    label: "Manuais Técnicos",
    color: "bg-primary/10 text-primary border-primary/20",
    description: "Manuais de oficina e do proprietário com especificações completas",
  },
  tutorial: {
    label: "Tutoriais",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    description: "Guias passo-a-passo para manutenção e regulagem",
  },
  catalogo: {
    label: "Catálogos de Peças",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    description: "Referências oficiais com códigos e vistas explodidas",
  },
  revista: {
    label: "Revistas e Publicações",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    description: "Conteúdo editorial e histórico do motociclismo",
  },
};

const categoryOrder = ["manual", "tutorial", "catalogo", "revista"];

const Manuais = () => {
  const [search, setSearch] = useState("");

  useSEO({
    title: "Manuais Técnicos — Agrale, Yamaha, Cagiva e KTM",
    description: "Artigos técnicos baseados nos manuais oficiais de Agrale, Yamaha, Cagiva e KTM. Leia online gratuitamente.",
    url: "/manuais",
    type: "website",
  });

  const filtered = manuals.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.models.some((mod) => mod.toLowerCase().includes(q))
    );
  });

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      ...categoryConfig[cat],
      items: filtered.filter((m) => m.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const totalCount = filtered.length;

  return (
    <main className="py-12">
      <div className="container max-w-5xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>

        <ScrollReveal>
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">
              Biblioteca Técnica
            </span>
            <h1 className="section-title mb-4">Manuais e Documentos</h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Acervo com {manuals.length} artigos técnicos baseados nos manuais oficiais.
              Leia online gratuitamente: manuais de oficina, catálogos de peças, tutoriais de manutenção e publicações históricas.
            </p>
          </div>
        </ScrollReveal>

        {/* Search */}
        <ScrollReveal delay={100}>
          <div className="mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, modelo ou marca…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
            {search && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {totalCount} resultado{totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </ScrollReveal>

        {/* Quick stats */}
        <ScrollReveal delay={150}>
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryOrder.map((cat) => {
              const cfg = categoryConfig[cat];
              const count = manuals.filter((m) => m.category === cat).length;
              return (
                <div
                  key={cat}
                  className={`rounded-lg border p-3 text-center ${cfg.color}`}
                >
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Grouped content */}
        {grouped.length === 0 && (
          <div className="card-industrial p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum documento encontrado para "{search}".
            </p>
          </div>
        )}

        <Accordion type="multiple" defaultValue={categoryOrder} className="space-y-4">
          {grouped.map((group, gi) => (
            <ScrollReveal key={group.category} delay={gi * 80}>
              <AccordionItem
                value={group.category}
                className="card-industrial border rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex flex-col">
                      <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                        {group.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-normal normal-case tracking-normal">
                        {group.description} · {group.items.length} artigo{group.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-4 pt-0">
                  <div className="space-y-3">
                    {group.items.map((manual) => {
                      const Icon = manual.icon;
                      return (
                        <Link
                          key={manual.blogSlug}
                          to={`/blog/${manual.blogSlug}`}
                          className="group flex flex-col gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-secondary/40 sm:flex-row sm:items-center"
                        >
                          {manual.coverImage ? (
                            <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border/30">
                              <img
                                src={manual.coverImage}
                                alt={manual.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-105">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground mb-1 group-hover:text-primary transition-colors">
                              {manual.title}
                            </h3>
                            <p className="text-[11px] leading-relaxed text-muted-foreground mb-2">
                              {manual.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                {manual.brand}
                              </Badge>
                              {manual.models.slice(0, 3).map((m) => (
                                <Badge
                                  key={m}
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 text-muted-foreground"
                                >
                                  {m}
                                </Badge>
                              ))}
                              {manual.models.length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 text-muted-foreground"
                                >
                                  +{manual.models.length - 3}
                                </Badge>
                              )}
                              {manual.year && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 text-muted-foreground"
                                >
                                  {manual.year}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-xs font-semibold text-foreground transition-all group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground flex-shrink-0">
                            <ArrowRight className="h-3.5 w-3.5" />
                            Ler Artigo
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </ScrollReveal>
          ))}
        </Accordion>

        {/* CTA */}
        <ScrollReveal delay={300}>
          <div className="mt-10 card-industrial p-8 text-center">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Precisa de ajuda técnica?
            </h2>
            <p className="mb-5 text-xs text-muted-foreground">
              Nossa equipe de especialistas pode ajudar com dúvidas sobre peças, compatibilidade e manutenção.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/suporte-tecnico"
                className="btn-primary-glow inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold"
              >
                Suporte Técnico
              </Link>
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30"
              >
                Ver Catálogo de Peças
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </main>
  );
};

export default Manuais;
