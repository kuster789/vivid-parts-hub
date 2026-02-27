import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const DashboardSection = ({ title, icon: Icon, children, defaultOpen = true }: DashboardSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 group"
      >
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          {title}
        </h2>
        <div className="flex-1 border-t border-border/50 mx-2" />
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export default DashboardSection;
