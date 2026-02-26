import type { LucideIcon } from "lucide-react";

export interface StatusCard {
  label: string;
  value: number;
  icon: LucideIcon;
  variant: "warning" | "info" | "success" | "destructive";
}

const variantStyles: Record<string, { text: string; bg: string }> = {
  warning: { text: "text-amber-500", bg: "bg-amber-500/10" },
  info: { text: "text-blue-400", bg: "bg-blue-400/10" },
  success: { text: "text-success", bg: "bg-success/10" },
  destructive: { text: "text-destructive", bg: "bg-destructive/10" },
};

interface StatusPipelineProps {
  cards: StatusCard[];
}

const StatusPipeline = ({ cards }: StatusPipelineProps) => (
  <div className="grid gap-3 sm:grid-cols-4">
    {cards.map(({ label, value, icon: Icon, variant }) => {
      const style = variantStyles[variant];
      return (
        <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.bg}`}>
            <Icon className={`h-4 w-4 ${style.text}`} />
          </div>
          <div>
            <p className={`font-display text-lg font-bold ${style.text}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        </div>
      );
    })}
  </div>
);

export default StatusPipeline;
