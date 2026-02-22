import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Bell, Megaphone, Tag, Info } from "lucide-react";

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("promotion");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!title || !message) return;
    setSending(true);
    await supabase.from("notifications").insert({
      user_id: null,
      title,
      message,
      type,
    });
    setSending(false);
    setSent(true);
    setTitle("");
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  const typeOptions = [
    { value: "promotion", label: "Promoção", icon: Megaphone, color: "text-primary" },
    { value: "new_product", label: "Novo Produto", icon: Tag, color: "text-green-500" },
    { value: "info", label: "Informação", icon: Info, color: "text-blue-400" },
  ];

  const inputClass = "rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Enviar Notificação
            </h3>
            <p className="text-[10px] text-muted-foreground">Envie uma notificação para todos os usuários</p>
          </div>
        </div>

        {/* Type selector */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">Tipo da notificação</label>
          <div className="flex gap-2">
            {typeOptions.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                  type === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${type === value ? "text-primary" : color}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Grande promoção de inverno!"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva a notificação..."
              rows={3}
              className={`${inputClass} w-full`}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !title || !message}
            className="btn-primary-glow flex items-center gap-2 rounded-lg px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar para todos
          </button>
          {sent && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-500">
              ✅ Notificação enviada com sucesso!
            </span>
          )}
        </div>
      </div>

      {/* Triggers info */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Gatilhos Automáticos</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { emoji: "📦", title: "Status do pedido", desc: "Notifica o cliente quando o status muda", trigger: "on_order_status_change" },
            { emoji: "🆕", title: "Novo produto", desc: "Notifica todos quando um produto é adicionado", trigger: "on_new_product" },
            { emoji: "🎉", title: "Novo cupom", desc: "Notifica todos quando um cupom é criado", trigger: "on_new_coupon" },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{emoji} {title}</p>
                <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Ativo
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
