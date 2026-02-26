import { Warehouse, Filter, Download, FileText, Pencil } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CONDITION_COLORS = ["hsl(var(--primary))", "hsl(200, 70%, 50%)"];

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  condition: string;
}

interface InventorySectionProps {
  brands: string[];
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  inventoryValue: number;
  filteredCount: number;
  inventoryCount: number;
  brandChartData: Array<{ brand: string; valor: number }>;
  conditionChartData: Array<{ name: string; value: number }>;
  topProducts: Array<ProductRow & { totalValue: number }>;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onEditProduct: (product: ProductRow) => void;
}

const InventorySection = ({
  brands, selectedBrand, onBrandChange,
  inventoryValue, filteredCount, inventoryCount,
  brandChartData, conditionChartData, topProducts,
  onExportCSV, onExportPDF, onEditProduct,
}: InventorySectionProps) => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Warehouse className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Valor do Estoque</h3>
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <select
          value={selectedBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          aria-label="Filtrar por marca"
        >
          <option value="">Todas as marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
          ))}
        </select>
        <button onClick={onExportCSV} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary" aria-label="Exportar estoque como CSV">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <button onClick={onExportPDF} className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary" aria-label="Exportar estoque como PDF">
          <FileText className="h-3.5 w-3.5" /> PDF
        </button>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground">Valor Total (preço × estoque)</p>
        <p className="mt-1 font-display text-2xl font-black text-primary">
          R$ {inventoryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground">Produtos Filtrados</p>
        <p className="mt-1 font-display text-2xl font-black text-foreground">{filteredCount}</p>
      </div>
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground">Unidades em Estoque</p>
        <p className="mt-1 font-display text-2xl font-black text-foreground">{inventoryCount}</p>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-border p-4 lg:col-span-2">
        <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Valor do Estoque por Marca</p>
        {brandChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="brand" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Valor"]}
              />
              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Condição das Peças</p>
        {conditionChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={conditionChartData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {conditionChartData.map((_, i) => (
                  <Cell key={i} fill={CONDITION_COLORS[i % CONDITION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
        )}
      </div>
    </div>

    <div className="divide-y divide-border rounded-lg border border-border">
      <div className="px-4 py-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top 5 por valor em estoque</p>
      </div>
      {topProducts.map((p) => (
        <div key={p.id} className="flex items-center justify-between px-4 py-2.5 group cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => onEditProduct(p)}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
            <p className="text-[10px] text-muted-foreground">{p.brand.toUpperCase()} · {p.stock} un. × R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            <span className="font-display text-sm font-bold text-primary">
              R$ {p.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ))}
      {topProducts.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum produto encontrado</p>
      )}
    </div>
  </div>
);

export default InventorySection;
