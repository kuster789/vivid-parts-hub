import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import {
  Package, Users, ShoppingBag, Plus, Pencil, Trash2, Save, X,
  BarChart3, Upload, Image, Loader2, Eye, Truck, FileBox, Search,
  ChevronDown, ChevronUp, Calendar, DollarSign, TrendingUp
} from "lucide-react";
import { uploadProductImage, deleteProductImage, upload3DModel } from "@/lib/storage";
import { brands } from "@/data/products";
import AdminCharts from "@/components/AdminCharts";

type Tab = "dashboard" | "products" | "orders" | "users";

const Admin = () => {
  const { user, isAdmin, isEmployee, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return <div className="flex min-h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || (!isAdmin && !isEmployee)) return <Navigate to="/login" replace />;

  return (
    <main className="py-8">
      <div className="container">
        <h1 className="section-title mb-6">Painel Administrativo</h1>
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "products", label: "Produtos", icon: Package },
            { id: "orders", label: "Pedidos", icon: ShoppingBag },
            ...(isAdmin ? [{ id: "users" as Tab, label: "Usuários", icon: Users }] : []),
          ] as { id: Tab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium transition-all ${
                tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "products" && <AdminProducts />}
        {tab === "orders" && <AdminOrders />}
        {tab === "users" && isAdmin && <AdminUsers />}
      </div>
    </main>
  );
};

/* ─── DASHBOARD ─── */
const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { count: prodCount } = await supabase.from("products").select("*", { count: "exact", head: true });
      const { data: orders } = await supabase.from("orders").select("total, status");
      const o = orders || [];
      setStats({
        products: prodCount || 0,
        orders: o.length,
        revenue: o.reduce((s, x) => s + Number(x.total), 0),
        pending: o.filter((x) => x.status === "pending").length,
        shipped: o.filter((x) => x.status === "shipped").length,
        delivered: o.filter((x) => x.status === "delivered").length,
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: "Produtos", value: stats.products, icon: Package, color: "text-primary" },
    { label: "Pedidos", value: stats.orders, icon: ShoppingBag, color: "text-primary" },
    { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
    { label: "Pendentes", value: stats.pending, icon: Calendar, color: "text-yellow-500" },
    { label: "Enviados", value: stats.shipped, icon: Truck, color: "text-blue-400" },
    { label: "Entregues", value: stats.delivered, icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-industrial flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-display text-xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>
      <AdminCharts />
    </div>
  );
};

/* ─── PRODUCTS ─── */
const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "" });
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
    await supabase.from("products").insert({ ...newProduct, active: true });
    setShowAdd(false);
    setNewProduct({ name: "", description: "", price: 0, sku: "", stock: 0, brand: "", model: "" });
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

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={file3DInputRef} type="file" accept=".glb,.gltf,.obj,.stl,.usdz" className="hidden" onChange={handle3DUpload} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar produto..."
            className="w-full rounded-md border border-border bg-secondary pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filteredProducts.length} produto(s)</span>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary-glow flex items-center gap-2 rounded-md px-4 py-2 text-xs">
            <Plus className="h-4 w-4" /> Novo Produto
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card-industrial mb-4 p-4">
          <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-foreground">Novo Produto</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <input placeholder="Nome" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            <input placeholder="SKU" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            <select value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value, model: "" })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="">Marca</option>
              {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
            <select value={newProduct.model} onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="">Modelo</option>
              {brands.find((b) => b.slug === newProduct.brand)?.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" placeholder="Preço" value={newProduct.price || ""} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            <input type="number" placeholder="Estoque" value={newProduct.stock || ""} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
              className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>
          <textarea placeholder="Descrição" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="mt-3 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" rows={2} />
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="btn-primary-glow rounded-md px-4 py-2 text-xs">Salvar</button>
            <button onClick={() => setShowAdd(false)} className="rounded-md border border-border px-4 py-2 text-xs text-muted-foreground">Cancelar</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filteredProducts.map((p) => (
          <div key={p.id} className="card-industrial p-4">
            <div className="flex items-center gap-4">
              {editing === p.id ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome"
                    className="flex-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} placeholder="Preço"
                    className="w-28 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                  <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })} placeholder="Estoque"
                    className="w-20 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                  <select value={editForm.brand || ""} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value, model: "" })}
                    className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option value="">Marca</option>
                    {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                  </select>
                  <select value={editForm.model || ""} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none">
                    <option value="">Modelo</option>
                    {brands.find((b) => b.slug === editForm.brand)?.models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button onClick={() => handleSave(p.id)} className="rounded-md bg-primary p-2 text-primary-foreground"><Save className="h-4 w-4" /></button>
                  <button onClick={() => setEditing(null)} className="rounded-md border border-border p-2 text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Image className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.brand?.toUpperCase()} · {p.model}</span>
                      {p.sku && <span>· SKU: {p.sku}</span>}
                      {p.has_3d && <span className="rounded-sm bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">3D</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Est: {p.stock}</span>
                  <span className="font-display text-sm font-bold text-primary whitespace-nowrap">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>

                  {/* Upload image */}
                  <button onClick={() => { setUploadTarget(p.id); fileInputRef.current?.click(); }} disabled={uploading === p.id}
                    className="rounded-md p-2 text-muted-foreground hover:text-primary" title="Upload foto">
                    {uploading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </button>
                  {/* Upload 3D */}
                  <button onClick={() => { setUpload3DTarget(p.id); file3DInputRef.current?.click(); }} disabled={uploading3D === p.id}
                    className="rounded-md p-2 text-muted-foreground hover:text-primary" title="Upload modelo 3D (GLB, OBJ, STL, USDZ)">
                    {uploading3D === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBox className="h-4 w-4" />}
                  </button>
                  {/* Edit */}
                  <button onClick={() => { setEditing(p.id); setEditForm({ name: p.name, price: p.price, stock: p.stock, brand: p.brand, model: p.model }); }}
                    className="rounded-md p-2 text-muted-foreground hover:text-foreground" title="Editar"><Pencil className="h-4 w-4" /></button>
                  {/* Delete */}
                  <button onClick={() => handleDelete(p.id)} className="rounded-md p-2 text-muted-foreground hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
            </div>
            {/* Image gallery + 3D indicator */}
            {!editing && (p.images?.length > 0 || p.model_3d_url) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {p.images?.map((img: string, idx: number) => (
                  <div key={idx} className="group relative h-16 w-16 overflow-hidden rounded-md border border-border">
                    <img src={img} alt={`${p.name} ${idx + 1}`} className="h-full w-full object-cover" />
                    <button onClick={() => handleRemoveImage(p.id, img)}
                      className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
                {p.model_3d_url && (
                  <div className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-primary/5">
                    <FileBox className="h-6 w-6 text-primary" />
                    <span className="absolute bottom-0.5 text-[8px] font-bold text-primary">3D</span>
                    <button onClick={() => remove3DModel(p.id)}
                      className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── ORDERS ─── */
const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [trackingEditing, setTrackingEditing] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase.from("order_items").select("*, products(name, sku, brand, model, images)").eq("order_id", orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: data || [] }));
  };

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      await loadOrderItems(orderId);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "text-yellow-500",
    confirmed: "text-blue-400",
    shipped: "text-purple-400",
    delivered: "text-green-500",
    cancelled: "text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const updateStatus = async (id: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled") => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const saveTracking = async (id: string) => {
    await supabase.from("orders").update({ tracking_code: trackingCode }).eq("id", id);
    setOrders(orders.map((o) => (o.id === id ? { ...o, tracking_code: trackingCode } : o)));
    setTrackingEditing(null);
    setTrackingCode("");
  };

  const filteredOrders = orders.filter((o) => !statusFilter || o.status === statusFilter);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("")}
          className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${!statusFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
          Todos ({orders.length})
        </button>
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = orders.filter((o) => o.status === key).length;
          return (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhum pedido encontrado.</p>}

      <div className="flex flex-col gap-2">
        {filteredOrders.map((o) => (
          <div key={o.id} className="card-industrial overflow-hidden">
            {/* Header */}
            <button onClick={() => toggleExpand(o.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-secondary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs font-bold text-foreground">#{o.id.slice(0, 8)}</span>
                  <span className={`text-xs font-medium ${statusColors[o.status]}`}>● {statusLabels[o.status]}</span>
                </div>
                <p className="text-sm text-foreground">{o.shipping_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">
                  {o.shipping_city && `${o.shipping_city}, ${o.shipping_state}`}
                  {o.shipping_phone && ` · ${o.shipping_phone}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-lg font-bold text-primary">R$ {Number(o.total).toFixed(2).replace(".", ",")}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              {expandedOrder === o.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Expanded details */}
            {expandedOrder === o.id && (
              <div className="border-t border-border p-4 bg-secondary/20">
                {/* Order items */}
                <h4 className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Itens do Pedido</h4>
                <div className="mb-4 flex flex-col gap-1">
                  {(orderItems[o.id] || []).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-md bg-card p-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-secondary">
                        {item.products?.images?.[0] ? (
                          <img src={item.products.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.products?.name || "Produto"}</p>
                        <p className="text-[10px] text-muted-foreground">{item.products?.brand?.toUpperCase()} · {item.products?.model}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      <span className="text-xs font-semibold text-foreground">R$ {Number(item.unit_price * item.quantity).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                  {!orderItems[o.id] && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
                </div>

                {/* Tracking code */}
                <div className="mb-4">
                  <h4 className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Código de Rastreio</h4>
                  {trackingEditing === o.id ? (
                    <div className="flex gap-2">
                      <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: BR123456789BR"
                        className="flex-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                      <button onClick={() => saveTracking(o.id)} className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"><Save className="h-4 w-4" /></button>
                      <button onClick={() => setTrackingEditing(null)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{o.tracking_code || "—"}</span>
                      <button onClick={() => { setTrackingEditing(o.id); setTrackingCode(o.tracking_code || ""); }}
                        className="rounded-md p-1 text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>

                {/* Shipping info */}
                {o.shipping_address && (
                  <div className="mb-4">
                    <h4 className="mb-1 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço de Entrega</h4>
                    <p className="text-xs text-foreground">{o.shipping_address}</p>
                    <p className="text-xs text-muted-foreground">{o.shipping_city}, {o.shipping_state} - {o.shipping_zip}</p>
                  </div>
                )}

                {/* Notes */}
                {o.notes && (
                  <div className="mb-4">
                    <h4 className="mb-1 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Observações</h4>
                    <p className="text-xs text-foreground">{o.notes}</p>
                  </div>
                )}

                {/* Status buttons */}
                <h4 className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alterar Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
                    <button key={s} onClick={() => updateStatus(o.id, s)}
                      className={`rounded-sm border px-3 py-1 text-[10px] uppercase tracking-wider transition-all ${
                        o.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── USERS ─── */
const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = (profiles || []).map((p: any) => ({
      ...p,
      roles: (roles || []).filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
    }));
    setUsers(merged);
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: "admin" | "employee", hasRole: boolean) => {
    if (hasRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert([{ user_id: userId, role }]);
    }
    loadUsers();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-2">
      {users.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhum usuário registrado.</p>}
      {users.map((u) => (
        <div key={u.id} className="card-industrial flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{u.full_name || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground">
              {u.phone && `${u.phone} · `}
              {u.city && `${u.city}, ${u.state}`}
            </p>
          </div>
          <div className="flex gap-2">
            {(["admin", "employee"] as const).map((role) => (
              <button key={role} onClick={() => toggleRole(u.user_id, role, u.roles?.includes(role))}
                className={`rounded-sm border px-3 py-1 text-[10px] uppercase tracking-wider transition-all ${
                  u.roles?.includes(role) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}>
                {role}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;
