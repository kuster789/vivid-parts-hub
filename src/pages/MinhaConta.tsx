import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Save, Loader2, MapPin, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import Breadcrumbs from "@/components/Breadcrumbs";

const MinhaConta = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, address, city, state, zip_code")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip_code: data.zip_code || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <User className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Faça login para acessar sua conta.</p>
        <Link to="/login" className="btn-primary-glow rounded-md px-6 py-3 text-sm">Entrar</Link>
      </main>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados com sucesso! ✅" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    toast({ title: "Você saiu da sua conta." });
  };

  const states = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
  ];

  if (loading) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container max-w-2xl">
        <Breadcrumbs items={[{ label: "Minha Conta" }]} />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="section-title mb-1">Minha Conta</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        <div className="card-industrial p-6">
          <h2 className="mb-6 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
            <User className="h-4 w-4 text-primary" /> Dados Pessoais
          </h2>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome Completo *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Mail className="h-3 w-3" /> E-mail
              </label>
              <input
                value={user.email || ""}
                disabled
                className="w-full rounded-md border border-border bg-secondary/50 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Phone className="h-3 w-3" /> Telefone
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" /> Endereço
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Rua, número, complemento"
                className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* City + State + Zip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Cidade</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Cidade"
                  className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">UF</option>
                  {states.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">CEP</label>
                <input
                  name="zip_code"
                  value={form.zip_code}
                  onChange={handleChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary-glow mt-6 flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default MinhaConta;
