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

export const upload3DModel = async (productId: string, file: File, onProgress?: (percent: number) => void) => {
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
  
  // Use XMLHttpRequest for progress tracking if onProgress is provided
  if (onProgress) {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl.split('/public/')[0]}/object/public/${BUCKET}/${path}`;
      
      // We need a signed URL or just use the Supabase client but it doesn't support progress out of the box
      // Standard supabase-js doesn't support progress. We'll use a simulated progress for UI benefit 
      // while the actual upload happens, OR we just stick to the client and accept it's "all or nothing"
      // actually, we can use the fetch API with a custom readable stream or just simulated
      // Let's stick to the client for simplicity/auth but add a simulated "processing" phase.
    });
  }

  const { error, data } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000", // 1 year cache for 3D models (immutable mostly)
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
