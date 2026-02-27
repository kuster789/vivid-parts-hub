import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type DateRange = { from: Date; to: Date; label: string };

const presets: { label: string; getDates: () => { from: Date; to: Date } }[] = [
  { label: "Últimos 7 dias", getDates: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Últimos 30 dias", getDates: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Últimos 90 dias", getDates: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: "Este mês", getDates: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Todo período", getDates: () => ({ from: new Date(2020, 0, 1), to: new Date() }) },
];

interface DashboardDateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DashboardDateFilter = ({ value, onChange }: DashboardDateFilterProps) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(value.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(value.to);

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange({
        from: customFrom,
        to: customTo,
        label: `${format(customFrom, "dd/MM", { locale: ptBR })} — ${format(customTo, "dd/MM", { locale: ptBR })}`,
      });
      setCustomOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.label}
          onClick={() => {
            const dates = p.getDates();
            onChange({ ...dates, label: p.label });
          }}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            value.label === p.label
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          )}
        >
          {p.label}
        </button>
      ))}

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              !presets.some((p) => p.label === value.label)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Personalizado
            <ChevronDown className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3 space-y-3" align="end">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">De</p>
              <CalendarComponent
                mode="single"
                selected={customFrom}
                onSelect={setCustomFrom}
                className={cn("p-2 pointer-events-auto")}
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Até</p>
              <CalendarComponent
                mode="single"
                selected={customTo}
                onSelect={setCustomTo}
                className={cn("p-2 pointer-events-auto")}
              />
            </div>
          </div>
          <button
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
            className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Aplicar
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DashboardDateFilter;
