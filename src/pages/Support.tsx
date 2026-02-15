import { useState } from "react";
import { Search, Package, Truck, Headphones, ChevronRight } from "lucide-react";

const Support = () => {
  const [trackingCode, setTrackingCode] = useState("");

  return (
    <main className="py-8">
      <div className="container max-w-3xl">
        <h1 className="section-title mb-2">Suporte</h1>
        <p className="mb-10 text-sm text-muted-foreground">Como podemos ajudar?</p>

        {/* Tracking */}
        <section className="card-industrial mb-8 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
            <Truck className="h-4 w-4 text-primary" /> Rastrear Pedido
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite o código de rastreio"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="flex-1 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button className="btn-primary-glow rounded-md px-5 py-2.5 text-sm transition-all">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Quick links */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Package, title: "Meus Pedidos", desc: "Consulte seus pedidos" },
            { icon: Truck, title: "Entregas", desc: "Informações de envio" },
            { icon: Headphones, title: "Contato", desc: "Fale com a equipe" },
          ].map(({ icon: Icon, title, desc }) => (
            <button key={title} className="card-industrial flex items-center gap-4 p-5 text-left transition-all hover:border-primary/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Support;
