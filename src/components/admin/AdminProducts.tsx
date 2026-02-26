import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Plus, Pencil, Trash2, Save, X, Upload, Image, Loader2, FileBox,
  Search, Eye, GripVertical, AlertTriangle, CheckCircle, Clock, Ban, ChevronDown,
  ChevronLeft, ChevronRight, RotateCw, Wand2
} from "lucide-react";
import { uploadProductImage, deleteProductImage, upload3DModel } from "@/lib/storage";
import { brands } from "@/data/products";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface CompatibleModel {
  brand: string;
  model: string;
}

type ProductStatus = "available" | "on_order" | "out_of_stock";

const statusLabels: Record<ProductStatus, { label: string; icon: any; className: string }> = {
  available: { label: "Disponível", icon: CheckCircle, className: "bg-green-500/10 text-green-500" },
  on_order: { label: "Sob Encomenda", icon: Clock, className: "bg-yellow-500/10 text-yellow-500" },
  out_of_stock: { label: "Esgotado", icon: Ban, className: "bg-destructive/10 text-destructive" },
};

const getProductStatus = (product: any): ProductStatus => {
  if (product.stock === 0) return "out_of_stock";
  if (!product.active) return "on_order";
  return "available";
};

const generateSKU = (brand: string, model: string, name: string): string => {
  const b = (brand || "XXX").substring(0, 3).toUpperCase();
  const m = (model || "XX").replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
  const n = (name || "PRD").replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `${b}-${m}-${n}-${rnd}`;
};

const LOW_STOCK_THRESHOLD = 5;

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: 0, sku: "", stock: 0,
    brand: "", model: "", active: true, hasColors: false, condition: "nova" as string,
  });
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formModel3D, setFormModel3D] = useState<string | null>(null);
  const [formHas3D, setFormHas3D] = useState(false);
  const [compatModels, setCompatModels] = useState<CompatibleModel[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploading3D, setUploading3D] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [rotatingIdx, setRotatingIdx] = useState<number | null>(null);
  const [removingBgIdx, setRemovingBgIdx] = useState<number | null>(null);
  const [bgCompare, setBgCompare] = useState<{ originalUrl: string; resultBase64: string; idx: number } | null>(null);
  const [acceptingBg, setAcceptingBg] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const model3DInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "", active: true, hasColors: false, condition: "nova" });
    setFormImages([]);
    setFormModel3D(null);
    setFormHas3D(false);
    setCompatModels([]);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    const variations = Array.isArray(p.variations) ? p.variations : [];
    const hasColors = variations.some((v: any) => v.name?.toLowerCase() === "cor");
    setForm({
      name: p.name, description: p.description || "", price: p.price, sku: p.sku || "",
      stock: p.stock, brand: p.brand, model: p.model, active: p.active ?? true, hasColors, condition: p.condition || "nova",
    });
    setFormImages(p.images || []);
    setFormModel3D(p.model_3d_url || null);
    setFormHas3D(p.has_3d || false);
    setCompatModels((p.compatible_models as CompatibleModel[]) || []);
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleAutoSKU = () => {
    setForm(f => ({ ...f, sku: generateSKU(f.brand, f.model, f.name) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const tempId = editingId || "temp-" + Date.now();
    try {
      for (const file of files) {
        if (file.type !== "image/png") {
          toast.error(`Use apenas PNG com fundo transparente: ${file.name}`);
          continue;
        }
        const url = await uploadProductImage(tempId, file);
        setFormImages(prev => [...prev, url]);
      }
      toast.success("Imagem(ns) enviada(s)!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    }
    setUploading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleRemoveImage = async (url: string) => {
    setFormImages(prev => prev.filter(i => i !== url));
    await deleteProductImage(url);
  };

  const handle3DUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading3D(true);
    const tempId = editingId || "temp-" + Date.now();
    try {
      const url = await upload3DModel(tempId, file);
      setFormModel3D(url);
      setFormHas3D(true);
      toast.success("Modelo 3D enviado!");
    } catch (err: any) {
      toast.error("Erro no upload 3D: " + err.message);
    }
    setUploading3D(false);
    if (model3DInputRef.current) model3DInputRef.current.value = "";
  };

  const handleRemove3D = () => {
    setFormModel3D(null);
    setFormHas3D(false);
  };

  // Rotate image 90° clockwise using canvas
  const handleRotateImage = async (url: string, idx: number) => {
    setRotatingIdx(idx);
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; });
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Erro ao gerar imagem")), "image/png"));
      const file = new File([blob], `rotated-${Date.now()}.png`, { type: "image/png" });
      const tempId = editingId || "temp-" + Date.now();
      const newUrl = await uploadProductImage(tempId, file);
      setFormImages(prev => prev.map((u, i) => i === idx ? newUrl : u));
      await deleteProductImage(url);
      toast.success("Imagem rotacionada!");
    } catch (err: any) {
      toast.error("Erro ao rotacionar: " + err.message);
    } finally {
      setRotatingIdx(null);
    }
  };

  // Remove background using AI — step 1: get preview
  const handleRemoveBackground = async (url: string, idx: number) => {
    setRemovingBgIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { imageUrl: url },
      });
      if (error) throw new Error(error.message || "Erro na função");
      if (data?.error) throw new Error(data.error);

      const base64 = data.image;
      if (!base64) throw new Error("Nenhuma imagem retornada");

      // Show comparison dialog instead of auto-replacing
      setBgCompare({ originalUrl: url, resultBase64: base64, idx });
    } catch (err: any) {
      toast.error("Erro ao remover fundo: " + err.message);
    } finally {
      setRemovingBgIdx(null);
    }
  };

  // Remove background — step 2: accept result
  const handleAcceptBgRemoval = async () => {
    if (!bgCompare) return;
    setAcceptingBg(true);
    try {
      const res = await fetch(bgCompare.resultBase64);
      const blob = await res.blob();
      const file = new File([blob], `nobg-${Date.now()}.png`, { type: "image/png" });
      const tempId = editingId || "temp-" + Date.now();
      const newUrl = await uploadProductImage(tempId, file);
      setFormImages(prev => prev.map((u, i) => i === bgCompare.idx ? newUrl : u));
      await deleteProductImage(bgCompare.originalUrl);
      toast.success("Fundo removido com sucesso!");
      setBgCompare(null);
    } catch (err: any) {
      toast.error("Erro ao salvar imagem: " + err.message);
    } finally {
      setAcceptingBg(false);
    }
  };

  // Drag & drop image reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setFormImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx, 1);
      arr.splice(idx, 0, item);
      return arr;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.model) {
      toast.error("Preencha nome, marca e modelo.");
      return;
    }
    setSaving(true);
    const variations = form.hasColors
      ? [{ name: "Cor", options: ["Preto", "Branco", "Azul", "Amarelo", "Verde", "Vermelho", "Roxo"] }]
      : [];
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      sku: form.sku,
      stock: form.stock,
      brand: form.brand,
      model: form.model,
      active: form.active,
      condition: form.condition,
      variations,
      images: formImages,
      model_3d_url: formModel3D,
      has_3d: formHas3D,
      compatible_models: compatModels as any,
    };

    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) toast.error("Erro ao salvar: " + error.message);
      else toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) toast.error("Erro ao criar: " + error.message);
      else toast.success("Produto criado!");
    }
    setSaving(false);
    setShowForm(false);
    resetForm();
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto permanentemente? Registros relacionados (itens de pedido, reviews, wishlist) também serão removidos.")) return;
    // Remove dependent records first to avoid foreign key constraint errors
    await Promise.all([
      supabase.from("order_items").delete().eq("product_id", id),
      supabase.from("reviews").delete().eq("product_id", id),
      supabase.from("wishlist").delete().eq("product_id", id),
    ]);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir produto: " + error.message);
      return;
    }
    toast.success("Produto excluído.");
    loadProducts();
  };

  const filteredProducts = products.filter((p) =>
    !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);


  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const inputClass = "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

  const toggleCompatModel = (brand: string, model: string) => {
    const exists = compatModels.some(c => c.brand === brand && c.model === model);
    if (exists) setCompatModels(compatModels.filter(c => !(c.brand === brand && c.model === model)));
    else setCompatModels([...compatModels, { brand, model }]);
  };

  const toggleAllBrandModels = (brandSlug: string, models: string[]) => {
    const allSelected = models.every(m => compatModels.some(c => c.brand === brandSlug && c.model === m));
    if (allSelected) setCompatModels(compatModels.filter(c => c.brand !== brandSlug));
    else {
      const without = compatModels.filter(c => c.brand !== brandSlug);
      setCompatModels([...without, ...models.map(m => ({ brand: brandSlug, model: m }))]);
    }
  };

  return (
    <div>
      {/* Stock alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="mb-5 flex flex-wrap gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-500">{lowStockCount} produto(s) com estoque baixo (≤{LOW_STOCK_THRESHOLD})</span>
            </div>
          )}
          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2">
              <Ban className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">{outOfStockCount} produto(s) esgotado(s)</span>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nome, SKU ou marca..."
            className={`${inputClass} w-full pl-9`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{filteredProducts.length} produto(s)</span>
          <button onClick={openAdd} className="btn-primary-glow flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Products table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Produto</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">SKU</th>
              <th className="hidden px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:table-cell">Status</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estoque</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preço</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedProducts.map((p) => {
              const status = getProductStatus(p);
              const st = statusLabels[status];
              const StIcon = st.icon;
              return (
                <tr key={p.id} className="group transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                        {p.images && p.images.length > 0 ? (
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <Image className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                          <span>{p.brand?.toUpperCase()}</span>
                          <span>·</span>
                          <span>{p.model}</span>
                          {p.has_3d && <span className="rounded bg-primary/20 px-1 py-0.5 font-bold text-primary">3D</span>}
                          {p.condition === "usada" && <span className="rounded bg-yellow-500/15 px-1 py-0.5 font-bold text-yellow-600 dark:text-yellow-400">USADO</span>}
                          {p.images?.length > 0 && <span className="rounded bg-secondary px-1 py-0.5">{p.images.length} foto(s)</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${st.className}`}>
                      <StIcon className="h-3 w-3" />{st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.stock === 0 ? "bg-destructive/10 text-destructive" : p.stock <= LOW_STOCK_THRESHOLD ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-display text-sm font-bold text-primary">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/produto/${p.id}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Ver">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Mostrando {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[2rem] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                  page === safePage ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="my-8 w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                {editingId ? "Editar Produto" : "Novo Produto"}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6 space-y-6">
              {/* Basic info */}
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">📦 Informações Básicas</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Nome do Produto *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Kit Pistão Completo RD 135" className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Marca Principal *</label>
                    <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value, model: "" })} className={`${inputClass} w-full`}>
                      <option value="">Selecione</option>
                      {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Modelo Principal *</label>
                    <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={`${inputClass} w-full`}>
                      <option value="">Selecione</option>
                      {brands.find((b) => b.slug === form.brand)?.models.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">SKU</label>
                    <div className="flex gap-2">
                      <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Manual ou auto-gerar" className={`${inputClass} flex-1`} />
                      <button type="button" onClick={handleAutoSKU} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Gerar SKU automático">
                        Auto
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Preço (R$) *</label>
                    <input type="number" step="0.01" min="0" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={`${inputClass} w-full`} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Estoque</label>
                    <input type="number" min="0" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={`${inputClass} w-full`} />
                    {form.stock > 0 && form.stock <= LOW_STOCK_THRESHOLD && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-yellow-500">
                        <AlertTriangle className="h-3 w-3" /> Estoque baixo
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Condição *</label>
                    <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={`${inputClass} w-full`}>
                      <option value="nova">Nova</option>
                      <option value="usada">Usada</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                      <span className="text-sm text-foreground">Produto ativo</span>
                    </label>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-muted-foreground">Descrição</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrição detalhada do produto..." className={`${inputClass} w-full`} rows={4} />
                </div>
              </section>

              {/* Images */}
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">🖼️ Imagens</h4>
                <p className="mb-3 text-[11px] text-muted-foreground">Arraste para reordenar. Formatos: JPG, PNG, WEBP.</p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {formImages.map((img, idx) => (
                    <div
                      key={img}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`group/img relative h-24 w-24 cursor-grab overflow-hidden rounded-lg border transition-all ${
                        dragIdx === idx ? "border-primary ring-2 ring-primary/30 opacity-50" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <img src={img} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      {(rotatingIdx === idx || removingBgIdx === idx) && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-background/60 opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <button onClick={() => handleRemoveBackground(img, idx)} disabled={rotatingIdx !== null || removingBgIdx !== null} className="rounded bg-secondary p-1 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50" title="Remover fundo (IA)">
                          <Wand2 className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleRotateImage(img, idx)} disabled={rotatingIdx !== null || removingBgIdx !== null} className="rounded bg-secondary p-1 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50" title="Girar 90°">
                          <RotateCw className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleRemoveImage(img)} className="rounded bg-destructive/90 p-1 text-destructive-foreground" title="Remover">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground">CAPA</span>
                      )}
                    </div>
                  ))}
                  {/* Upload button */}
                  <input ref={imageInputRef} type="file" accept=".png" multiple className="hidden" onChange={handleImageUpload} />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    <span className="text-[10px]">{uploading ? "Enviando..." : "Adicionar"}</span>
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">⚠️ Use apenas <strong>PNG com fundo transparente</strong> para melhor resultado no seletor de cores.</p>
              </section>

              {/* 3D Model */}
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">🧩 Modelo 3D</h4>
                <p className="mb-3 text-[11px] text-muted-foreground">Formatos: GLB (prioritário), glTF. Carregamento otimizado no navegador.</p>
                {formModel3D ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                    <FileBox className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">Modelo 3D carregado</p>
                      <p className="text-[10px] text-muted-foreground truncate">{formModel3D.split("/").pop()}</p>
                    </div>
                    <button onClick={handleRemove3D} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input ref={model3DInputRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handle3DUpload} />
                    <button
                      onClick={() => model3DInputRef.current?.click()}
                      disabled={uploading3D}
                      className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                    >
                      {uploading3D ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBox className="h-4 w-4" />}
                      <span className="text-xs">{uploading3D ? "Enviando..." : "Upload Modelo 3D"}</span>
                    </button>
                  </>
                )}
              </section>

              {/* Colors */}
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">🎨 Variações de Cor</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasColors} onChange={(e) => setForm({ ...form, hasColors: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <span className="text-sm text-foreground">Este produto possui variações de cor</span>
                </label>
                {form.hasColors && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { name: "Preto", hex: "#1a1a1a" },
                      { name: "Branco", hex: "#f5f5f5" },
                      { name: "Azul", hex: "#2563eb" },
                      { name: "Amarelo", hex: "#eab308" },
                      { name: "Verde", hex: "#16a34a" },
                      { name: "Vermelho", hex: "#dc2626" },
                      { name: "Roxo", hex: "#7c3aed" },
                    ].map(c => (
                      <div key={c.name} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5">
                        <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs text-foreground">{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Compatible models */}
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  🔧 Modelos Compatíveis
                  {compatModels.length > 0 && <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">{compatModels.length}</span>}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {brands.map((b) => {
                    const allSelected = b.models.every(m => compatModels.some(c => c.brand === b.slug && c.model === m));
                    const someSelected = b.models.some(m => compatModels.some(c => c.brand === b.slug && c.model === m));
                    return (
                      <div key={b.slug} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <label className="flex items-center gap-2 cursor-pointer mb-2 pb-2 border-b border-border">
                          <input type="checkbox" checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={() => toggleAllBrandModels(b.slug, b.models)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-xs font-bold text-foreground">{b.name}</span>
                          {someSelected && <span className="text-[10px] text-muted-foreground">({b.models.filter(m => compatModels.some(c => c.brand === b.slug && c.model === m)).length}/{b.models.length})</span>}
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {b.models.map((m) => {
                            const checked = compatModels.some(c => c.brand === b.slug && c.model === m);
                            return (
                              <label key={m} className="flex items-center gap-2 cursor-pointer rounded px-1.5 py-1 hover:bg-secondary transition-colors">
                                <input type="checkbox" checked={checked} onChange={() => toggleCompatModel(b.slug, m)}
                                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary" />
                                <span className={`text-xs ${checked ? "text-foreground font-medium" : "text-muted-foreground"}`}>{m}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="text-[10px] text-muted-foreground">
                {formImages.length} imagem(ns) · {formHas3D ? "3D ✓" : "Sem 3D"} · {form.hasColors ? "Cores ✓" : "Sem cores"}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border border-border px-5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary-glow flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold disabled:opacity-50">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {editingId ? "Salvar Alterações" : "Criar Produto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background removal comparison dialog */}
      {bgCompare && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setBgCompare(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                <Wand2 className="h-4 w-4 text-primary" /> Comparação — Remover Fundo
              </h3>
              <button onClick={() => setBgCompare(null)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Antes</p>
                  <div className="relative overflow-hidden rounded-lg border border-border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                    <img src={bgCompare.originalUrl} alt="Original" className="h-56 w-full object-contain" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Depois</p>
                  <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
                    <img src={bgCompare.resultBase64} alt="Sem fundo" className="h-56 w-full object-contain" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setBgCompare(null)} className="rounded-lg border border-border px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Descartar
                </button>
                <button onClick={handleAcceptBgRemoval} disabled={acceptingBg} className="btn-primary-glow flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold disabled:opacity-50">
                  {acceptingBg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Aceitar Resultado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
