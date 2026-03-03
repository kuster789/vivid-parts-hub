import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";

export const getProductImageUrl = (path: string) => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadProductImage = async (productId: string, file: File) => {
  const ext = file.name.split(".").pop();
  const path = `${productId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return getProductImageUrl(path);
};

export const deleteProductImage = async (url: string) => {
  const parts = url.split(`/object/public/${BUCKET}/`);
  if (parts.length < 2) return;
  const path = decodeURIComponent(parts[1]);
  await supabase.storage.from(BUCKET).remove([path]);
};

export const upload3DModel = async (productId: string, file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["glb", "gltf", "obj", "stl", "3mf", "step", "stp", "usdz"];
  if (!ext || !allowedExts.includes(ext)) {
    throw new Error(`Formato não suportado. Use: ${allowedExts.join(", ")}`);
  }
  const path = `${productId}/model_3d.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  return getProductImageUrl(path);
};
