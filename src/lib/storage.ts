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
    contentType: file.type,
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

  // Define correct content-type for 3D models
  let contentType = "application/octet-stream";
  if (ext === "glb") contentType = "model/gltf-binary";
  else if (ext === "gltf") contentType = "model/gltf+json";
  else if (ext === "usdz") contentType = "model/vnd.usdz+zip";
  else if (ext === "stl") contentType = "model/stl";
  else if (ext === "obj") contentType = "text/plain";

  const path = `${productId}/model_3d_${Date.now()}.${ext}`;
  
  console.log(`Iniciando upload do modelo 3D: ${path} (${file.size} bytes)`);
  
  const { error, data } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType,
  });

  if (error) {
    console.error("Erro no upload do Supabase Storage:", error);
    throw error;
  }
  
  console.log("Upload concluído com sucesso:", data);
  return getProductImageUrl(path);
};
