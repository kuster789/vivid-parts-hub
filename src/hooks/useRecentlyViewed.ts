import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 8;

interface RecentProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  image?: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addProduct = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { items, addProduct };
}
