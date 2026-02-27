import { Plus, DollarSign, Download, FileText } from "lucide-react";

interface QuickActionsProps {
  onNewOrder?: () => void;
  onNewSale?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
}

const QuickActions = ({ onNewOrder, onNewSale, onExportCSV, onExportPDF }: QuickActionsProps) => {
  const actions = [
    { label: "Registrar Venda", icon: DollarSign, onClick: onNewSale, variant: "primary" as const },
    { label: "Exportar CSV", icon: Download, onClick: onExportCSV, variant: "secondary" as const },
    { label: "Exportar PDF", icon: FileText, onClick: onExportPDF, variant: "secondary" as const },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map(({ label, icon: Icon, onClick, variant }) => (
        <button
          key={label}
          onClick={onClick}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            variant === "primary"
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              : "border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
