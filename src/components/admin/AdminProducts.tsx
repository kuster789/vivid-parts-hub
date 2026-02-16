import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Plus, Pencil, Trash2, Save, X, Upload, Image, Loader2, FileBox, Search, Eye
} from "lucide-react";
import { uploadProductImage, deleteProductImage, upload3DModel } from "@/lib/storage";
import { brands } from "@/data/products";
import { Link } from "react-router-dom";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "", hasColors: false });
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploading3D, setUploading3D] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file3DInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [upload3DTarget, setUpload3DTarget] = useState<string | null>(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
  };

  const handleSave = async (id: string) => {
    await supabase.from("products").update(editForm).eq("id", id);
    setEditing(null);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const handleAdd = async () => {
    const variations = newProduct.hasColors
      ? [{ name: "Cor", options: ["Preto", "Branco", "Azul", "Amarelo", "Vermelho", "Roxo"] }]
      : [];
    await supabase.from("products").insert({ name: newProduct.name, description: newProduct.description, price: newProduct.price, sku: newProduct.sku, stock: newProduct.stock, brand: newProduct.brand, model: newProduct.model, active: true, variations });
    setShowAdd(false);
    setNewProduct({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "", hasColors: false });
    loadProducts();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setUploading(uploadTarget);
    try {
      const url = await uploadProductImage(uploadTarget, file);
      const product = products.find((p) => p.id === uploadTarget);
      const currentImages = product?.images || [];
      await supabase.from("products").update({ images: [...currentImages, url] }).eq("id", uploadTarget);
      loadProducts();
    } catch (err: any) {
      alert("Erro no upload: " + err.message);
    }
    setUploading(null);
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handle3DUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !upload3DTarget) return;
    setUploading3D(upload3DTarget);
    try {
      const url = await upload3DModel(upload3DTarget, file);
      await supabase.from("products").update({ model_3d_url: url, has_3d: true }).eq("id", upload3DTarget);
      loadProducts();
    } catch (err: any) {
      alert("Erro no upload 3D: " + err.message);
    }
    setUploading3D(null);
    setUpload3DTarget(null);
    if (file3DInputRef.current) file3DInputRef.current.value = "";
  };

  const handleRemoveImage = async (productId: string, imageUrl: string) => {
    if (!confirm("Remover esta imagem?")) return;
    const product = products.find((p) => p.id === productId);
    const updatedImages = (product?.images || []).filter((img: string) => img !== imageUrl);
    await supabase.from("products").update({ images: updatedImages }).eq("id", productId);
    await deleteProductImage(imageUrl);
    loadProducts();
  };

  const remove3DModel = async (productId: string) => {
    if (!confirm("Remover modelo 3D?")) return;
    await supabase.from("products").update({ model_3d_url: null, has_3d: false }).eq("id", productId);
    loadProducts();
  };

  const filteredProducts = products.filter((p) =>
    !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={file3DInputRef} type="file" accept=".glb,.gltf,.obj,.stl,.usdz" className="hidden" onChange={handle3DUpload} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nome, SKU ou marca..."
            className={`${inputClass} w-full pl-9`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{filteredProducts.length} produto(s)</span>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary-glow flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold">
            <Plus className="h-4 w-4" /> Novo Produto
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-5 rounded-xl border border-primary/20 bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Novo Produto</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <input placeholder="Nome" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className={inputClass} />
            <input placeholder="SKU" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} className={inputClass} />
            <select value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value, model: "" })} className={inputClass}>
              <option value="">Marca</option>
              {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
            <select value={newProduct.model} onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })} className={inputClass}>
              <option value="">Modelo</option>
              {brands.find((b) => b.slug === newProduct.brand)?.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" placeholder="Preço" value={newProduct.price || ""} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className={inputClass} />
            <input type="number" placeholder="Estoque" value={newProduct.stock || ""} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className={inputClass} />
          </div>
          <textarea placeholder="Descrição" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className={`${inputClass} mt-3 w-full`} rows={2} />
          <label className="mt-3 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newProduct.hasColors} onChange={(e) => setNewProduct({ ...newProduct, hasColors: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            <span className="text-sm text-foreground">Produto com variação de cores</span>
          </label>
          <div className="mt-4 flex gap-2">
            <button onClick={handleAdd} className="btn-primary-glow rounded-lg px-5 py-2 text-xs font-semibold">Salvar</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg border border-border px-5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Produto</th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:table-cell">SKU</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estoque</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preço</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="group transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Image className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{p.brand?.toUpperCase()}</span>
                        <span>·</span>
                        <span>{p.model}</span>
                        {p.has_3d && <span className="rounded bg-primary/20 px-1 py-0.5 font-bold text-primary">3D</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.stock === 0 ? "bg-destructive/10 text-destructive" : p.stock <= 5 ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
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
                    <button onClick={() => { setUploadTarget(p.id); fileInputRef.current?.click(); }} disabled={uploading === p.id}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors" title="Upload foto">
                      {uploading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { setUpload3DTarget(p.id); file3DInputRef.current?.click(); }} disabled={uploading3D === p.id}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors" title="Upload 3D">
                      {uploading3D === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileBox className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { setEditing(p.id); setEditForm({ name: p.name, price: p.price, stock: p.stock, brand: p.brand, model: p.model }); }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Editar Produto</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">Nome</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Marca</label>
                <select value={editForm.brand || ""} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value, model: "" })} className={`${inputClass} w-full`}>
                  <option value="">Marca</option>
                  {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Modelo</label>
                <select value={editForm.model || ""} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className={`${inputClass} w-full`}>
                  <option value="">Modelo</option>
                  {brands.find((b) => b.slug === editForm.brand)?.models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Preço</label>
                <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Estoque</label>
                <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} className={`${inputClass} w-full`} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border border-border px-5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={() => handleSave(editing)} className="btn-primary-glow rounded-lg px-5 py-2 text-xs font-semibold">
                <Save className="mr-1 inline h-3.5 w-3.5" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
