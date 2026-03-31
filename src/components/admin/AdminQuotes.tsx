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
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto ao orçamento");
      return;
    }

    setGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const margin = 14;
      const contentW = pageW - margin * 2;

      // Preload logo + all product images in parallel
      const logoPromise = loadImageAsDataUrl(`${window.location.origin}/images/logo-agrale.png`);
      const imagePromises = items.map(item =>
        item.product.images?.[0] ? loadImageAsDataUrl(item.product.images[0]) : Promise.resolve(null)
      );
      const [logoDataUrl, ...productImages] = await Promise.all([logoPromise, ...imagePromises]);

      let y = 0;

      const addHeader = () => {
        // Dark header bar
        doc.setFillColor(24, 24, 27);
        doc.rect(0, 0, pageW, 48, "F");
        // Accent line
        doc.setFillColor(220, 38, 38);
        doc.rect(0, 48, pageW, 1.5, "F");

        if (logoDataUrl) {
          doc.addImage(logoDataUrl, "PNG", margin, 6, 20, 20);
        }

        const tx = logoDataUrl ? margin + 24 : margin;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("ORÇAMENTO", tx, 17);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text("AUTO PEÇAS AGRALE", tx, 24);
        doc.text("CNPJ: 62.440.010/0001-03", tx, 29);
        doc.text("WhatsApp: (43) 9643-8823", tx, 34);
        doc.text("autopecaagralecagiva@outlook.com", tx, 39);

        // Right side
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageW - margin, 17, { align: "right" });
        if (validity) {
          const vd = new Date();
          vd.setDate(vd.getDate() + parseInt(validity));
          doc.setFont("helvetica", "normal");
          doc.text(`Válido até: ${vd.toLocaleDateString("pt-BR")}`, pageW - margin, 24, { align: "right" });
        }
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
        if (y + needed > 275) {
          addFooter();
          doc.addPage();
          y = margin + 5;
        }
      };

      // === PAGE CONTENT ===
      addHeader();
      y = 55;

      // Client info box
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

      // Product rows with images
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const rowH = 20;
        checkPage(rowH + 2);

        // Zebra striping
        if (idx % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(margin, y - 1, contentW, rowH, "F");
        }

        // Product image
        const imgData = productImages[idx];
        if (imgData) {
          try {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin + 2, y, 16, 16, 1, 1, "F");
            doc.setDrawColor(235, 235, 235);
            doc.roundedRect(margin + 2, y, 16, 16, 1, 1, "S");
            doc.addImage(imgData, "JPEG", margin + 3, y + 1, 14, 14);
          } catch { /* skip image */ }
        } else {
          doc.setFillColor(240, 240, 240);
          doc.roundedRect(margin + 2, y, 16, 16, 1, 1, "F");
          doc.setTextColor(180, 180, 180);
          doc.setFontSize(6);
          doc.text("Sem img", margin + 5, y + 9);
        }

        // Product info
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        const nameText = doc.splitTextToSize(item.product.name, 85);
        doc.text(nameText[0], margin + 22, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text(`${item.product.brand} ${item.product.model}`, margin + 22, y + 11);
        if (item.product.sku) {
          doc.text(`SKU: ${item.product.sku}`, margin + 22, y + 15);
        }

        // Quantity
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${item.quantity}`, margin + contentW - 68, y + 9, { align: "center" });

        // Unit price
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(fmt(item.unitPrice), margin + contentW - 38, y + 9, { align: "right" });

        // Total
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 30, 30);
        doc.text(fmt(item.unitPrice * item.quantity), margin + contentW - 2, y + 9, { align: "right" });

        // Row divider
        doc.setDrawColor(235, 235, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y + rowH, margin + contentW, y + rowH);

        y += rowH + 1;
      }

      // Totals section
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

      // Total box
      doc.setFillColor(24, 24, 27);
      doc.roundedRect(totalsX - 2, y - 1, contentW - totalsX + margin + 4, 12, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL:", totalsX + 4, y + 7);
      doc.text(fmt(total), margin + contentW, y + 7, { align: "right" });
      y += 20;

      // Notes
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
