import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Trash2, FileDown, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  sku: string | null;
  images: string[] | null;
  stock: number;
}

interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

const AdminQuotes = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [validity, setValidity] = useState("7");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const filtered = products.filter(p =>
    `${p.name} ${p.brand} ${p.model} ${p.sku || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (product: Product) => {
    if (items.find(i => i.product.id === product.id)) {
      setItems(prev => prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, { product, quantity: 1, unitPrice: product.price }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.product.id !== id) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    }));
  };

  const updatePrice = (id: string, price: number) => {
    setItems(prev => prev.map(i => i.product.id === id ? { ...i, unitPrice: price } : i));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.product.id !== id));
  };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountValue = subtotal * (discountPercent / 100);
  const total = subtotal - discountValue;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const generatePDF = async () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto ao orçamento");
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // Load logo
      let logoDataUrl: string | null = null;
      try {
        const res = await fetch("/pwa-512x512.png");
        const blob = await res.blob();
        logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* skip logo */ }

      // Header
      doc.setFillColor(23, 23, 23);
      doc.rect(0, 0, pageW, 52, "F");

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", margin, 5, 30, 30);
      }

      const textX = logoDataUrl ? margin + 34 : margin;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ORÇAMENTO", textX, 16);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Auto Peças Agrale", textX, 23);
      doc.setFontSize(7.5);
      doc.setTextColor(200, 200, 200);
      doc.text("WhatsApp: (43) 9643-8823  |  autopecaagralecagiva@outlook.com", textX, 29);
      doc.text("CNPJ: 62.440.010/0001-03  |  Londrina - PR", textX, 34);

      // Right side: date & validity
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageW - margin, 16, { align: "right" });
      if (validity) {
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + parseInt(validity));
        doc.text(`Válido até: ${validDate.toLocaleDateString("pt-BR")}`, pageW - margin, 23, { align: "right" });
      }

      y = 58;

      // Client info
      if (clientName || clientPhone || clientEmail) {
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("DADOS DO CLIENTE", margin, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (clientName) { doc.text(`Nome: ${clientName}`, margin, y); y += 5; }
        if (clientPhone) { doc.text(`Telefone: ${clientPhone}`, margin, y); y += 5; }
        if (clientEmail) { doc.text(`E-mail: ${clientEmail}`, margin, y); y += 5; }
        y += 5;
      }

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, contentW, 8, "F");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("#", margin + 2, y + 5.5);
      doc.text("Produto", margin + 10, y + 5.5);
      doc.text("Qtd", margin + contentW - 60, y + 5.5, { align: "right" });
      doc.text("Unit.", margin + contentW - 30, y + 5.5, { align: "right" });
      doc.text("Total", margin + contentW, y + 5.5, { align: "right" });
      y += 10;

      // Table rows
      doc.setFont("helvetica", "normal");
      items.forEach((item, idx) => {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }
        const rowH = 7;
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 1, contentW, rowH, "F");
        }
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(9);
        doc.text(`${idx + 1}`, margin + 2, y + 4);
        const productText = `${item.product.name} — ${item.product.brand} ${item.product.model}`;
        doc.text(productText.substring(0, 60), margin + 10, y + 4);
        doc.text(`${item.quantity}`, margin + contentW - 60, y + 4, { align: "right" });
        doc.text(fmt(item.unitPrice), margin + contentW - 30, y + 4, { align: "right" });
        doc.text(fmt(item.unitPrice * item.quantity), margin + contentW, y + 4, { align: "right" });
        y += rowH;
      });

      // Totals
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + contentW, y);
      y += 7;

      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal:", margin + contentW - 50, y);
      doc.text(fmt(subtotal), margin + contentW, y, { align: "right" });
      y += 6;

      if (discountPercent > 0) {
        doc.setTextColor(220, 50, 50);
        doc.text(`Desconto (${discountPercent}%):`, margin + contentW - 50, y);
        doc.text(`- ${fmt(discountValue)}`, margin + contentW, y, { align: "right" });
        y += 6;
      }

      doc.setFillColor(23, 23, 23);
      doc.rect(margin + contentW - 75, y - 1, 75, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL:", margin + contentW - 50, y + 5);
      doc.text(fmt(total), margin + contentW - 2, y + 5, { align: "right" });

      y += 18;

      // Notes
      if (notes) {
        if (y > 250) { doc.addPage(); y = margin; }
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Observações:", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(notes, contentW);
        doc.text(splitNotes, margin, y);
        y += splitNotes.length * 4.5;
      }

      // Footer
      const footerY = 285;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, margin + contentW, footerY - 5);
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text("Auto Peças Agrale — Orçamento gerado automaticamente", pageW / 2, footerY, { align: "center" });

      doc.save(`orcamento_${clientName ? clientName.replace(/\s+/g, "_") : "cliente"}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buscar Produtos</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, marca, modelo ou SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Itens do Orçamento
            {items.length > 0 && <Badge variant="secondary" className="ml-2">{items.length}</Badge>}
          </CardTitle>
          <Button onClick={generatePDF} disabled={items.length === 0 || generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Gerar PDF
          </Button>
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

              {/* Totals */}
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
