import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";

const Wishlist = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data: wishItems } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);
      
      if (!wishItems || wishItems.length === 0) { setProducts([]); setLoading(false); return; }
      
      const ids = wishItems.map((w: any) => w.product_id);
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
      setProducts(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center">
        <Heart className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <p className="mb-4 text-muted-foreground">Faça login para ver sua lista de desejos.</p>
        <Link to="/login" className="btn-primary-glow rounded-md px-6 py-3 text-sm">Entrar</Link>
      </main>
    );
  }

  return (
    <main className="py-8">
      <div className="container">
        <h1 className="section-title mb-6">Lista de Desejos</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <Heart className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="mb-2 text-muted-foreground">Sua lista de desejos está vazia.</p>
            <Link to="/catalogo" className="text-sm text-primary hover:underline">Explorar catálogo</Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
