import { Link } from "react-router-dom";
import { ArrowLeft, Download, FileText, BookOpen, Wrench, Settings } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

interface ManualItem {
  title: string;
  description: string;
  fileName: string;
  category: "manual" | "catalogo" | "tutorial" | "revista";
  brand: string;
  models: string[];
  icon: typeof FileText;
}

const manuals: ManualItem[] = [
  {
    title: "Manual de Oficina - Motocicletas Agrale",
    description: "Manual técnico completo com especificações, desmontagem/montagem de motor, embreagem, câmbio, sistema elétrico, freios e suspensão. Edição de Novembro 1991.",
    fileName: "Manual_de_Oficina_Motocicleta_Agrale.pdf",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5"],
    icon: Wrench,
  },
  {
    title: "Manual do Proprietário - Agrale 27.5 / SXT / Dakar 30.0 (Parte I)",
    description: "Introdução, características técnicas, normas de segurança, identificação da moto, controles e instruções para dirigir.",
    fileName: "Manual_Agrale_30.0_-_Part_I.pdf",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale 27.5 E", "Agrale Dakar 30.0"],
    icon: BookOpen,
  },
  {
    title: "Manual do Proprietário - Agrale 27.5 / Dakar 30.0 (Parte II)",
    description: "Comandos elétricos, acelerador, freio dianteiro, embreagem, câmbio e instruções de pilotagem.",
    fileName: "Manual_Agrale_30.0_-_Part_II.pdf",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale 27.5 E", "Agrale Dakar 30.0"],
    icon: BookOpen,
  },
  {
    title: "Manual do Proprietário - Agrale 27.5 / Dakar 30.0 (Parte III)",
    description: "Manutenção periódica, lubrificação, sistema de arrefecimento e carburador.",
    fileName: "Manual_Agrale_30.0_-_Part_III.pdf",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale 27.5 E", "Agrale Dakar 30.0"],
    icon: BookOpen,
  },
  {
    title: "Manual do Proprietário - Agrale 27.5 / Dakar 30.0 (Parte IV)",
    description: "Filtros, vela de ignição, corrente de transmissão, freios e suspensão.",
    fileName: "Manual_Agrale_30.0_-_Part_IV.pdf",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale 27.5 E", "Agrale Dakar 30.0"],
    icon: Settings,
  },
  {
    title: "Manual do Proprietário - Agrale 27.5 / Dakar 30.0 (Parte V)",
    description: "Rodas, sistema elétrico, bateria, farol e ferramentas.",
    fileName: "Manual_Agrale_30.0_-_Part_V.pdf",
    category: "manual",
    brand: "Agrale",
    models: ["Agrale 27.5", "Agrale 27.5 E", "Agrale Dakar 30.0"],
    icon: Settings,
  },
  {
    title: "Limpeza e Regulagem - Carburadores Dellorto",
    description: "Tutorial passo-a-passo com fotos para limpeza e regulagem do carburador Dellorto PHBL-25 (Agrale EX, SXT, Dakar e outros modelos).",
    fileName: "Limpeza_e_regulagem_carburadores_Delorto.pdf",
    category: "tutorial",
    brand: "Agrale",
    models: ["Agrale 27.5 E", "Agrale 27.5 EX", "Agrale Dakar 30.0"],
    icon: Wrench,
  },
  {
    title: "Catálogo de Peças Agrale",
    description: "Catálogo oficial com referências de peças, códigos e ilustrações explodidas dos conjuntos mecânicos.",
    fileName: "Catalogo_de_pecas_da_Agrale.pdf",
    category: "catalogo",
    brand: "Agrale",
    models: ["Agrale 13.5", "Agrale 16.5", "Agrale 27.5", "Agrale Dakar 30.0"],
    icon: FileText,
  },
  {
    title: "Revista Moto 4 Rodas Nº 34 (1984)",
    description: "Edição histórica com comparativo Yamaha RD 350 LC vs Honda CB 450 Esporte. Conteúdo clássico do motociclismo brasileiro.",
    fileName: "1984_Moto_4_Rodas_34.pdf",
    category: "revista",
    brand: "Yamaha",
    models: ["RD 350"],
    icon: BookOpen,
  },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "bg-primary/10 text-primary" },
  catalogo: { label: "Catálogo", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  tutorial: { label: "Tutorial", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  revista: { label: "Revista", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

const Manuais = () => (
  <main className="py-12">
    <div className="container max-w-5xl">
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar ao início
      </Link>

      <ScrollReveal>
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">Biblioteca Técnica</span>
          <h1 className="section-title mb-4">Manuais e Documentos</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Acesse manuais de oficina, catálogos de peças, tutoriais de manutenção e conteúdo técnico
            para as motocicletas Agrale, Yamaha, Cagiva e KTM.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid gap-4">
        {manuals.map((manual, idx) => {
          const cat = categoryLabels[manual.category];
          const Icon = manual.icon;
          return (
            <ScrollReveal key={manual.fileName} delay={idx * 60}>
              <div className="card-industrial group flex flex-col gap-4 p-6 transition-all duration-300 hover:border-primary/40 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                  <Icon className="h-7 w-7 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                      {manual.title}
                    </h3>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat.color}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="mb-2 text-xs leading-relaxed text-muted-foreground">{manual.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{manual.brand}</span>
                    {manual.models.slice(0, 3).map(m => (
                      <span key={m} className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{m}</span>
                    ))}
                    {manual.models.length > 3 && (
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">+{manual.models.length - 3}</span>
                    )}
                  </div>
                </div>

                <a
                  href={`/manuals/${manual.fileName}`}
                  download
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-5 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary hover:text-primary-foreground flex-shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </a>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      <ScrollReveal delay={300}>
        <div className="mt-10 card-industrial p-8 text-center">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-foreground">Precisa de ajuda técnica?</h2>
          <p className="mb-5 text-xs text-muted-foreground">
            Nossa equipe de especialistas pode ajudar com dúvidas sobre peças, compatibilidade e manutenção.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/suporte-tecnico" className="btn-primary-glow inline-flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold">
              Suporte Técnico
            </Link>
            <Link to="/catalogo" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/30">
              Ver Catálogo de Peças
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </main>
);

export default Manuais;
