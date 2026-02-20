import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Truck, Headphones, ChevronRight, MessageSquare, Phone, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const Support = () => {
  const [trackingCode, setTrackingCode] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTrack = () => {
    if (!trackingCode.trim()) {
      toast({ title: "Digite um código de rastreio", variant: "destructive" });
      return;
    }
    navigate(`/rastreamento?busca=${encodeURIComponent(trackingCode.trim())}`);
  };

  const handleMeusPedidos = () => {
    if (!user) {
      toast({ title: "Você ainda não possui pedidos.", description: "Faça login para ver seus pedidos." });
      return;
    }
    navigate("/rastreamento");
  };

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
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="flex-1 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button onClick={handleTrack} className="btn-primary-glow rounded-md px-5 py-2.5 text-sm transition-all">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Contact Info */}
        <section className="card-industrial mb-8 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" /> Fale Conosco
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="https://wa.me/554396438823"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-all hover:border-primary/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">+55 43 9643-8823</p>
              </div>
            </a>
            <a
              href="mailto:autopecaagralecagiva@outlook.com"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-all hover:border-primary/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">E-mail</p>
                <p className="text-xs text-muted-foreground">autopecaagralecagiva@outlook.com</p>
              </div>
            </a>
          </div>
        </section>

        {/* Quick links */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Package, title: "Meus Pedidos", desc: "Consulte seus pedidos", action: handleMeusPedidos },
            { icon: Truck, title: "Entregas", desc: "Informações de envio", action: () => navigate("/envio") },
            { icon: Headphones, title: "Chat IA", desc: "Assistente virtual 24h", action: () => {
              const chatBtn = document.querySelector('[aria-label="Abrir chat"]') as HTMLButtonElement;
              chatBtn?.click();
            }},
          ].map(({ icon: Icon, title, desc, action }) => (
            <button key={title} onClick={action} className="card-industrial flex items-center gap-4 p-5 text-left transition-all hover:border-primary/40">
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
