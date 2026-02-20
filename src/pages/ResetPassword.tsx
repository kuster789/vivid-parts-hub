import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery token
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("Erro ao redefinir senha. Tente novamente.");
    } else {
      setSuccess(true);
      toast({ title: "Senha redefinida!", description: "Sua senha foi alterada com sucesso." });
      setTimeout(() => navigate("/"), 3000);
    }
  };

  if (!isRecovery && !success) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center py-8">
        <div className="card-industrial w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
            Link Inválido
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este link de redefinição é inválido ou expirou. Solicite um novo link na página de login.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn-primary-glow mt-4 rounded-md px-6 py-2.5 text-sm"
          >
            Ir para Login
          </button>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center py-8">
        <div className="card-industrial w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <CheckCircle className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
            Senha Redefinida!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua senha foi alterada com sucesso. Redirecionando...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center py-8">
      <div className="card-industrial w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary">
            <KeyRound className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
            Nova Senha
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nova Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirmar Senha</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="Repita a nova senha"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-glow rounded-md py-3 text-sm transition-all disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Redefinir Senha"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;
