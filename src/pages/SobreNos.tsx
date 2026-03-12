import { Link } from "react-router-dom";
import { Building2, Wrench, Users, Mail, Phone } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const SobreNos = () => {
  useSEO({
    title: "Sobre Nós — Especialistas em Peças para Motos",
    description: "Conheça a Auto Peças Agrale, especialistas em peças para Agrale, Yamaha, Cagiva e KTM. Qualidade, confiança e envio para todo o Brasil.",
    url: "/sobre",
    type: "website",
  });

  return (
  <main className="py-12">
    <div className="container max-w-3xl">
      <h1 className="section-title mb-8">Sobre Nós</h1>

      <div className="card-industrial p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">AUTO PEÇAS AGRALE</h2>
            <p className="text-xs text-muted-foreground">Especialistas em peças para motos clássicas e esportivas</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            A <span className="font-semibold text-foreground">Auto Peças Agrale</span> é referência no mercado de peças e componentes para motocicletas clássicas e esportivas. Trabalhamos com as principais marcas do segmento — <span className="text-primary">Yamaha</span>, <span className="text-primary">Agrale</span>, <span className="text-primary">Cagiva</span> e <span className="text-primary">KTM</span> — oferecendo peças de alta qualidade para manutenção e restauração.
          </p>
          <p>
            Nossa missão é manter vivas as máquinas que marcaram gerações, fornecendo componentes técnicos de precisão com o melhor atendimento do mercado. Contamos com um catálogo amplo que inclui pistões, cilindros, virabrequins, carburadores, CDIs e muito mais.
          </p>
          <p>
            Com anos de experiência no segmento, nos orgulhamos de oferecer não apenas peças, mas conhecimento técnico especializado para ajudar nossos clientes a encontrarem exatamente o que precisam.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Wrench, title: "Qualidade", desc: "Peças selecionadas e testadas para garantir durabilidade e performance." },
          { icon: Users, title: "Atendimento", desc: "Equipe especializada pronta para ajudar na escolha da peça certa." },
          { icon: Mail, title: "Suporte", desc: "Suporte técnico via WhatsApp e e-mail para tirar todas as dúvidas." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card-industrial p-6 text-center">
            <Icon className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card-industrial p-6">
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Contato</h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> WhatsApp: +55 43 9643-8823</p>
          <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> autopecaagralecagiva@outlook.com</p>
          <a
            href="https://g.page/r/CXLTbcNYPugJEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ⭐ Avaliar no Google
          </a>
        </div>
      </div>
    </div>
  </main>
  );
};

export default SobreNos;
