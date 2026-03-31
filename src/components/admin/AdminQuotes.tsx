import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Minus, Trash2, FileDown, Loader2, Percent,
  ArrowLeft, Edit, Eye, List,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

/* ───── types ───── */
interface Product {
  id: string; name: string; brand: string; model: string;
  price: number; sku: string | null; images: string[] | null; stock: number;
}
interface QuoteItem {
  product: Product; quantity: number; unitPrice: number;
}
interface SavedQuote {
  id: string; quote_number: string; status: string;
  client_name: string | null; client_email: string | null;
  total: number; created_at: string;
}

type View = "list" | "editor";

/* ───── component ───── */
const AdminQuotes = () => {
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState("");

  // list state
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listSearch, setListSearch] = useState("");

  // editor state
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [validity, setValidity] = useState("7");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchQuotes(); }, []);

  /* ───── data fetching ───── */
  const fetchQuotes = async () => {
    setListLoading(true);
    const { data } = await supabase
      .from("quotes")
      .select("id, quote_number, status, client_name, client_email, total, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setSavedQuotes((data as SavedQuote[]) || []);
    setListLoading(false);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, brand, model, price, sku, images, stock")
      .eq("active", true)
      .order("name");
    setProducts(data || []);
    setLoading(false);
  };

  /* ───── brands / models ───── */
  const brands = [...new Set(products.map(p => p.brand))].sort();
  const models = [...new Set(
    products.filter(p => brandFilter === "all" || p.brand === brandFilter).map(p => p.model)
  )].sort();

  const filtered = products.filter(p => {
    if (brandFilter !== "all" && p.brand !== brandFilter) return false;
    if (modelFilter !== "all" && p.model !== modelFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!`${p.name} ${p.brand} ${p.model} ${p.sku || ""}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  /* ───── editor helpers ───── */
  const resetEditor = () => {
    setEditingId(null); setQuoteNumber(""); setItems([]);
    setClientName(""); setClientPhone(""); setClientEmail("");
    setNotes(""); setValidity("7"); setDiscountPercent(0); setStatus("draft");
    setSearch(""); setBrandFilter("all"); setModelFilter("all");
  };

  const openNew = () => { resetEditor(); fetchProducts(); setView("editor"); };

  const openExisting = async (q: SavedQuote) => {
    resetEditor();
    setEditingId(q.id);
    setQuoteNumber(q.quote_number);
    setView("editor");
    await fetchProducts();

    // load full quote data
    const { data: full } = await supabase.from("quotes").select("*").eq("id", q.id).single();
    if (full) {
      setClientName((full as any).client_name || "");
      setClientPhone((full as any).client_phone || "");
      setClientEmail((full as any).client_email || "");
      setNotes((full as any).notes || "");
      setValidity(String((full as any).validity_days || 7));
      setDiscountPercent(Number((full as any).discount_percent) || 0);
      setStatus((full as any).status || "draft");
    }

    // load items
    const { data: qItems } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", q.id);
    if (qItems) {
      setItems(qItems.map((qi: any) => ({
        product: {
          id: qi.product_id, name: qi.product_name, brand: qi.product_brand,
          model: qi.product_model, price: qi.unit_price, sku: qi.product_sku,
          images: qi.product_image ? [qi.product_image] : null, stock: 0,
        },
        quantity: qi.quantity,
        unitPrice: qi.unit_price,
      })));
    }
  };

  const addItem = (product: Product) => {
    if (items.find(i => i.product.id === product.id)) {
      setItems(prev => prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, { product, quantity: 1, unitPrice: product.price }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(i => i.product.id !== id ? i : { ...i, quantity: Math.max(1, i.quantity + delta) }));
  };
  const updatePrice = (id: string, price: number) => {
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, unitPrice: price } : i));
  };
  const removeItem = (id: string) => { setItems(prev => prev.filter(i => i.product.id !== id)); };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountValue = subtotal * (discountPercent / 100);
  const total = subtotal - discountValue;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  /* ───── save quote ───── */
  const saveQuote = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let qid = editingId;
      let qnum = quoteNumber;

      if (!qid) {
        // Generate quote number server-side
        const { data: numData, error: numErr } = await supabase.rpc("generate_quote_number");
        if (numErr) throw numErr;
        qnum = numData as string;

        const { data: ins, error: insErr } = await supabase.from("quotes").insert({
          quote_number: qnum,
          status,
          client_name: clientName || null,
          client_phone: clientPhone || null,
          client_email: clientEmail || null,
          notes: notes || null,
          validity_days: parseInt(validity) || 7,
          discount_percent: discountPercent,
          subtotal, discount_value: discountValue, total,
          created_by: user.id,
        }).select("id").single();
        if (insErr) throw insErr;
        qid = (ins as any).id;
        setEditingId(qid);
        setQuoteNumber(qnum);
      } else {
        const { error: updErr } = await supabase.from("quotes").update({
          status,
          client_name: clientName || null,
          client_phone: clientPhone || null,
          client_email: clientEmail || null,
          notes: notes || null,
          validity_days: parseInt(validity) || 7,
          discount_percent: discountPercent,
          subtotal, discount_value: discountValue, total,
        }).eq("id", qid);
        if (updErr) throw updErr;
      }

      // Replace items
      await supabase.from("quote_items").delete().eq("quote_id", qid!);
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("quote_items").insert(
          items.map(i => ({
            quote_id: qid!,
            product_id: i.product.id,
            product_name: i.product.name,
            product_brand: i.product.brand,
            product_model: i.product.model,
            product_sku: i.product.sku,
            product_image: i.product.images?.[0] || null,
            quantity: i.quantity,
            unit_price: i.unitPrice,
          }))
        );
        if (itemsErr) throw itemsErr;
      }

      toast.success(`Orçamento ${qnum} salvo!`);
      fetchQuotes();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err.message || ""));
    } finally { setSaving(false); }
  };

  /* ───── PDF generation ───── */
  const loadImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  const generatePDF = async () => {
    if (items.length === 0) { toast.error("Adicione pelo menos um produto"); return; }

    // Auto-save before generating
    await saveQuote();

    setGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const margin = 14;
      const contentW = pageW - margin * 2;

      const logoPromise = loadImageAsDataUrl(`${window.location.origin}/images/logo-agrale.png`);
      const imagePromises = items.map(item =>
        item.product.images?.[0] ? loadImageAsDataUrl(item.product.images[0]) : Promise.resolve(null)
      );
      const [logoDataUrl, ...productImages] = await Promise.all([logoPromise, ...imagePromises]);

      let y = 0;

      const addHeader = () => {
        const headerH = 30;
        const pad = 14;

        // === LEFT: Logo (30% bigger = ~16mm) ===
        const logoW = 16;
        const logoH = 16;
        const logoY = (headerH - logoH) / 2;
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", pad, logoY, logoW, logoH);
        }

        // === CENTER: Title + Company Info ===
        const cx = logoDataUrl ? pad + logoW + 6 : pad;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("ORÇAMENTO", cx, 9);

        // Quote number
        if (quoteNumber) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(120, 120, 120);
          doc.text(quoteNumber, cx, 13.5);
        }

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text("Auto Peças Agrale", cx, 18);

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("CNPJ: 62.440.010/0001-03  |  WhatsApp: (43) 9643-8823  |  autopecaagralecagiva@outlook.com", cx, 22);

        // === RIGHT: Date Block ===
        const rx = pageW - pad;

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Data:", rx - 30, 9);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(new Date().toLocaleDateString("pt-BR"), rx, 9, { align: "right" });

        const vd = new Date();
        vd.setDate(vd.getDate() + (parseInt(validity) || 7));
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Validade:", rx - 30, 16);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(vd.toLocaleDateString("pt-BR"), rx, 16, { align: "right" });

        // Divider
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(pad, headerH, pageW - pad, headerH);
      };

      const addFooter = () => {
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 282, pageW, 15, "F");
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.5);
        doc.line(margin, 282, pageW - margin, 282);
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("Auto Peças Agrale — Londrina, PR — www.motopecasagrale.com.br", pageW / 2, 288, { align: "center" });
        doc.text("Este orçamento não constitui nota fiscal. Valores sujeitos a alteração.", pageW / 2, 292, { align: "center" });
      };

      const checkPage = (needed: number) => {
        if (y + needed > 275) { addFooter(); doc.addPage(); y = margin + 5; }
      };

      addHeader();
      y = 40;

      // Client info
      if (clientName || clientPhone || clientEmail) {
        doc.setFillColor(248, 248, 248);
        const boxH = 8 + (clientName ? 5 : 0) + (clientPhone ? 5 : 0) + (clientEmail ? 5 : 0) + 3;
        doc.roundedRect(margin, y, contentW, boxH, 2, 2, "F");
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(margin, y, contentW, boxH, 2, 2, "S");
        y += 6;
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("CLIENTE", margin + 4, y);
        y += 5;
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        if (clientName) { doc.text(clientName, margin + 4, y); y += 5; }
        if (clientPhone) { doc.text(`Tel: ${clientPhone}`, margin + 4, y); y += 5; }
        if (clientEmail) { doc.text(clientEmail, margin + 4, y); y += 5; }
        y += 5;
      }

      // Table header
      doc.setFillColor(24, 24, 27);
      doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("PRODUTO", margin + 22, y + 5.5);
      doc.text("QTD", margin + contentW - 68, y + 5.5, { align: "center" });
      doc.text("UNIT.", margin + contentW - 38, y + 5.5, { align: "right" });
      doc.text("TOTAL", margin + contentW - 2, y + 5.5, { align: "right" });
      y += 11;

      // Product rows
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const rowH = 20;
        checkPage(rowH + 2);
        if (idx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margin, y - 1, contentW, rowH, "F");
        }

        const imgData = productImages[idx];
        if (imgData) {
          try {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin + 2, y, 16, 16, 1, 1, "F");
            doc.setDrawColor(235, 235, 235);
            doc.roundedRect(margin + 2, y, 16, 16, 1, 1, "S");
            doc.addImage(imgData, "JPEG", margin + 3, y + 1, 14, 14);
          } catch { /* skip */ }
        } else {
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(margin + 2, y, 16, 16, 1, 1, "F");
          doc.setTextColor(180, 180, 180);
          doc.setFontSize(6);
          doc.text("Sem img", margin + 5, y + 9);
        }

        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const nameText = doc.splitTextToSize(item.product.name, 85);
        doc.text(nameText[0], margin + 22, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`${item.product.brand} ${item.product.model}`, margin + 22, y + 11);
        if (item.product.sku) doc.text(`SKU: ${item.product.sku}`, margin + 22, y + 15);

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${item.quantity}`, margin + contentW - 68, y + 9, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(fmt(item.unitPrice), margin + contentW - 38, y + 9, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 30, 30);
        doc.text(fmt(item.unitPrice * item.quantity), margin + contentW - 2, y + 9, { align: "right" });

        doc.setDrawColor(235, 235, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y + rowH, margin + contentW, y + rowH);
        y += rowH + 1;
      }

      // Totals
      y += 4;
      checkPage(35);
      const totalsX = margin + contentW - 80;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(totalsX, y, margin + contentW, y);
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", totalsX, y);
      doc.text(fmt(subtotal), margin + contentW - 2, y, { align: "right" });
      y += 6;
      if (discountPercent > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text(`Desconto (${discountPercent}%):`, totalsX, y);
        doc.text(`- ${fmt(discountValue)}`, margin + contentW - 2, y, { align: "right" });
        y += 6;
      }
      doc.setFillColor(24, 24, 27);
      doc.roundedRect(totalsX - 2, y - 1, contentW - totalsX + margin + 4, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL:", totalsX + 4, y + 7);
      doc.text(fmt(total), margin + contentW, y + 7, { align: "right" });
      y += 20;

      if (notes) {
        checkPage(25);
        doc.setFillColor(255, 251, 235);
        const splitNotes = doc.splitTextToSize(notes, contentW - 10);
        const notesH = 10 + splitNotes.length * 4;
        doc.roundedRect(margin, y, contentW, notesH, 2, 2, "F");
        doc.setDrawColor(251, 191, 36);
        doc.roundedRect(margin, y, contentW, notesH, 2, 2, "S");
        doc.setTextColor(180, 130, 0);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVAÇÕES", margin + 5, y + 5);
        doc.setTextColor(80, 60, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(splitNotes, margin + 5, y + 10);
      }

      addFooter();
      doc.save(`${quoteNumber || "orcamento"}_${clientName ? clientName.replace(/\s+/g, "_") : "cliente"}.pdf`);
      toast.success("PDF gerado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally { setGenerating(false); }
  };

  /* ───── status helpers ───── */
  const statusLabel: Record<string, string> = {
    draft: "Rascunho", sent: "Enviado", approved: "Aprovado", cancelled: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    draft: "secondary", sent: "default", approved: "default", cancelled: "destructive",
  };

  /* ───── filtered list ───── */
  const filteredQuotes = savedQuotes.filter(q => {
    if (!listSearch) return true;
    const s = listSearch.toLowerCase();
    return q.quote_number.toLowerCase().includes(s)
      || (q.client_name || "").toLowerCase().includes(s)
      || (q.client_email || "").toLowerCase().includes(s);
  });

  /* ═══════════════════════ RENDER ═══════════════════════ */

  // LIST VIEW
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nº, cliente ou e-mail..." value={listSearch} onChange={e => setListSearch(e.target.value)} className="pl-10" />
          </div>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Orçamento</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {listLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <List className="h-10 w-10 mb-2" />
                <p className="text-sm">Nenhum orçamento encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-sm">{q.quote_number}</TableCell>
                      <TableCell>{q.client_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColor[q.status] as any || "secondary"}>
                          {statusLabel[q.status] || q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(q.total)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(q.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openExisting(q)} className="gap-1">
                          <Edit className="h-3.5 w-3.5" /> Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // EDITOR VIEW
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setView("list"); fetchQuotes(); }} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">
            {quoteNumber ? quoteNumber : "Novo Orçamento"}
          </h2>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={saveQuote} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar
        </Button>
        <Button onClick={generatePDF} disabled={items.length === 0 || generating} className="gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Gerar PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product search with filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buscar Produtos</CardTitle>
            <div className="space-y-2 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Nome, SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={brandFilter} onValueChange={v => { setBrandFilter(v); setModelFilter("all"); }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Marcas</SelectItem>
                    {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Modelos</SelectItem>
                    {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
            ) : (
              filtered.slice(0, 30).map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50 transition-colors">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand} {p.model} {p.sku ? `• ${p.sku}` : ""}</p>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">{fmt(p.price)}</span>
                  <Button size="sm" variant="outline" onClick={() => addItem(p)} className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Client data */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Nome do cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
            <Input placeholder="Telefone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            <Input placeholder="E-mail" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Validade (dias)</label>
                <Input type="number" value={validity} onChange={e => setValidity(e.target.value)} min="1" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Desconto (%)</label>
                <div className="relative">
                  <Input type="number" value={discountPercent} onChange={e => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))} min="0" max="100" className="pr-8" />
                  <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <Textarea placeholder="Observações / condições de pagamento..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </CardContent>
        </Card>
      </div>

      {/* Quote items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Itens do Orçamento
            {items.length > 0 && <Badge variant="secondary" className="ml-2">{items.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Adicione produtos ao orçamento usando a busca acima</p>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-[1fr_100px_120px_120px_40px] gap-2 text-xs font-medium text-muted-foreground px-2 pb-1">
                <span>Produto</span>
                <span className="text-center">Qtd</span>
                <span className="text-right">Preço Unit.</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>
              {items.map(item => (
                <div key={item.product.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_120px_120px_40px] gap-2 items-center rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.brand} {item.product.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input type="number" value={item.unitPrice} onChange={e => updatePrice(item.product.id, Number(e.target.value))} className="h-8 text-right text-sm" min="0" step="0.01" />
                  <p className="text-sm font-semibold text-right">{fmt(item.unitPrice * item.quantity)}</p>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4">
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium w-28 text-right">{fmt(subtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex gap-4 text-sm text-destructive">
                    <span>Desconto ({discountPercent}%):</span>
                    <span className="font-medium w-28 text-right">- {fmt(discountValue)}</span>
                  </div>
                )}
                <div className="flex gap-4 text-base font-bold mt-1">
                  <span>Total:</span>
                  <span className="w-28 text-right">{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuotes;
