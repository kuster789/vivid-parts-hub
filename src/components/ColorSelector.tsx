import { useState } from "react";

export interface ColorOption {
  name: string;
  hex: string;
  filter: string; // CSS filter to tint images
}

export const colorOptions: ColorOption[] = [
  { name: "Preto", hex: "#1a1a1a", filter: "" },
  { name: "Branco", hex: "#f5f5f5", filter: "" },
  { name: "Azul", hex: "#2563eb", filter: "" },
  { name: "Amarelo", hex: "#eab308", filter: "" },
  { name: "Verde", hex: "#16a34a", filter: "" },
  { name: "Vermelho", hex: "#dc2626", filter: "" },
  { name: "Roxo", hex: "#7c3aed", filter: "" },
];

interface ColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorSelector = ({ selectedColor, onColorChange }: ColorSelectorProps) => {
  return (
    <div className="mb-4">
      <label className="mb-2 block font-display text-xs font-bold uppercase tracking-wider text-foreground">
        Cor: <span className="text-primary">{selectedColor || "Selecione"}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {colorOptions.map((color) => (
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
