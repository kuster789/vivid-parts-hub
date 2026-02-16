import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!user) { setWishlistIds([]); return; }
    const { data } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id);
    setWishlistIds((data || []).map((w: any) => w.product_id));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (productId: string) => {
    if (!user) return;
    if (wishlistIds.includes(productId)) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      setWishlistIds((prev) => [...prev, productId]);
    }
  };

  const isWished = (productId: string) => wishlistIds.includes(productId);

  return { wishlistIds, toggle, isWished, reload: load };
};
