import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Filter, X, MapPin, Tag, Globe, ChevronDown 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardFiltersProps {
  onFilterChange: (filters: {
    utmSource: string | null;
    state: string | null;
    brand: string | null;
  }) => void;
}

const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const DashboardFilters = ({ onFilterChange }: DashboardFiltersProps) => {
  const [utmSources, setUtmSources] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  
  const [selectedUtm, setSelectedUtm] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  useEffect(() => {
    const loadFilterData = async () => {
      const [
        { data: utmData },
        { data: brandData }
      ] = await Promise.all([
        supabase.from('analytics_events').select('utm_source').not('utm_source', 'is', null),
        supabase.from('products').select('brand').not('brand', 'is', null)
      ]);

      if (utmData) {
        const uniqueUtms = Array.from(new Set(utmData.map(item => item.utm_source))).filter(Boolean) as string[];
        setUtmSources(uniqueUtms);
      }
      
      if (brandData) {
        const uniqueBrands = Array.from(new Set(brandData.map(item => item.brand))).filter(Boolean) as string[];
        setBrands(uniqueBrands);
      }
    };

    loadFilterData();
  }, []);

  useEffect(() => {
    onFilterChange({
      utmSource: selectedUtm === "all" ? null : selectedUtm,
      state: selectedState === "all" ? null : selectedState,
      brand: selectedBrand === "all" ? null : selectedBrand,
    });
  }, [selectedUtm, selectedState, selectedBrand]);

  const clearFilters = () => {
    setSelectedUtm("all");
    setSelectedState("all");
    setSelectedBrand("all");
  };

  const hasActiveFilters = selectedUtm !== "all" || selectedState !== "all" || selectedBrand !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3 bg-background/40 p-2 rounded-lg border border-border/40">
      <div className="flex items-center gap-2 px-2 text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Filtros Avançados:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* UTM Source */}
        <div className="flex items-center gap-1.5">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <Select value={selectedUtm} onValueChange={setSelectedUtm}>
            <SelectTrigger className="h-8 w-[140px] text-[11px] bg-secondary/50">
              <SelectValue placeholder="Origem (UTM)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              {utmSources.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-8 w-[100px] text-[11px] bg-secondary/50">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Brasil</SelectItem>
              {BRAZIL_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="h-8 w-[140px] text-[11px] bg-secondary/50">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Marcas</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-tight"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardFilters;