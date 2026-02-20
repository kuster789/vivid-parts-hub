import { ScrollReveal } from "@/hooks/useScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Quais marcas de motos vocês atendem?",
    a: "Somos especialistas em peças para Agrale, Yamaha, Cagiva e KTM. Trabalhamos com componentes originais e de alta qualidade para mais de 21 modelos diferentes.",
  },
  {
    q: "As peças possuem garantia?",
    a: "Sim! Todas as nossas peças possuem garantia de fábrica. Produtos novos contam com garantia contra defeitos de fabricação e você pode solicitar devolução em até 7 dias.",
  },
  {
    q: "Vocês enviam para todo o Brasil?",
    a: "Sim, realizamos entregas para todo o território nacional com rastreamento em tempo real. Utilizamos as melhores transportadoras para garantir que sua peça chegue com segurança.",
  },
  {
    q: "Como funciona a visualização 3D dos produtos?",
    a: "Alguns produtos possuem modelos 3D interativos que permitem girar, ampliar e inspecionar cada detalhe da peça antes de comprar. Procure pelo selo '3D' nos produtos compatíveis.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Aceitamos PIX, cartão de crédito (parcelado em até 12x sem juros) e boleto bancário, tudo processado com segurança pelo Mercado Pago.",
  },
  {
    q: "Vocês vendem peças usadas?",
    a: "Sim, alguns produtos são peças usadas em bom estado, sempre identificados com o selo 'Usado'. Todas passam por inspeção de qualidade antes de serem disponibilizadas.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const FAQSection = () => (
  <section className="border-t border-border py-20">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="container max-w-3xl">
      <ScrollReveal>
        <div className="mb-10 text-center">
          <span className="mb-2 inline-block font-display text-[11px] font-bold uppercase tracking-widest text-primary">
            Dúvidas frequentes
          </span>
          <h2 className="section-title">Perguntas e Respostas</h2>
        </div>
      </ScrollReveal>
      <ScrollReveal>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="rounded-lg border border-border bg-card/50 px-4">
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:text-primary hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </div>
  </section>
);

export default FAQSection;
