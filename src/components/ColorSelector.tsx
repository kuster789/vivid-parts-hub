import { useState } from "react";

export interface ColorOption {
  name: string;
  hex: string;
  filter: string; // CSS filter to tint images
}

export const colorOptions: ColorOption[] = [
  { name: "Preto", hex: "#1a1a1a", filter: "brightness(0.3) saturate(0)" },
  { name: "Branco", hex: "#f5f5f5", filter: "brightness(1.3) saturate(0.1)" },
  { name: "Azul", hex: "#2563eb", filter: "brightness(0.8) saturate(1.5) hue-rotate(200deg)" },
  { name: "Amarelo", hex: "#eab308", filter: "brightness(1.1) saturate(1.5) hue-rotate(10deg)" },
  { name: "Vermelho", hex: "#dc2626", filter: "brightness(0.9) saturate(1.8) hue-rotate(330deg)" },
  { name: "Roxo", hex: "#7c3aed", filter: "brightness(0.8) saturate(1.5) hue-rotate(260deg)" },
  { name: "Polido", hex: "#c0c0c0", filter: "brightness(1.2) saturate(0.2) contrast(1.1)" },
  { name: "Escovado", hex: "#a0a0a0", filter: "brightness(0.95) saturate(0.15) contrast(0.9)" },
  { name: "Cromado", hex: "#e8e8e8", filter: "brightness(1.4) saturate(0.1) contrast(1.2)" },
  { name: "Fosco", hex: "#606060", filter: "brightness(0.6) saturate(0.1)" },
];

/** Check if a variation option matches a known color */
export const isColorOption = (optionName: string): boolean =>
  colorOptions.some((c) => c.name.toLowerCase() === optionName.toLowerCase());

/** Find variations that contain color-like options */
export const getColorVariation = (variations: any[]): { name: string; options: string[] } | null => {
  for (const v of variations) {
    const opts = v.options || [];
    const colorOpts = opts.filter((o: string) => isColorOption(o));
    if (colorOpts.length >= 2 || (colorOpts.length >= 1 && opts.length <= 4)) {
      return { name: v.name, options: colorOpts };
    }
  }
  return null;
};

interface ColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  availableColors?: string[];
}

const ColorSelector = ({ selectedColor, onColorChange, availableColors }: ColorSelectorProps) => {
  const displayColors = availableColors
    ? colorOptions.filter((c) => availableColors.some((ac) => ac.toLowerCase() === c.name.toLowerCase()))
    : colorOptions;
  return (
    <div className="mb-4">
      <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-foreground">
        Cor: <span className="text-primary">{selectedColor || "Selecione"}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {displayColors.map((color) => (
          <button
            key={color.name}
            onClick={() => onColorChange(color.name)}
            title={color.name}
            className={`relative h-9 w-9 rounded-full border-2 transition-all ${
              selectedColor === color.name
                ? "border-primary ring-2 ring-primary/30 scale-110"
                : "border-border hover:border-primary/40 hover:scale-105"
            }`}
            style={{ backgroundColor: color.hex }}
          >
            {selectedColor === color.name && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={color.name === "Branco" || color.name === "Amarelo" ? "#1a1a1a" : "#ffffff"} strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
