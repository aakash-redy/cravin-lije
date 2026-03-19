import { useState, useEffect } from "react";
import { Coffee, Zap, GlassWater, Utensils, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Define your icons map (optional, adds that premium feel)
const categoryIcons: Record<string, any> = {
  "Chai": Coffee,
  "Coffee": Coffee,
  "Immunity Boosters": Zap,
  "Coolers": GlassWater,
  "Snacks": Utensils,
  "Specials": Sparkles
};

interface CategoryNavProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

const CategoryNav = ({ categories, activeCategory, onSelect }: CategoryNavProps) => {
  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 py-3 pl-4">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pr-4">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat] || Utensils; // Fallback icon
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm border",
                isActive 
                  ? "bg-slate-900 text-white border-slate-900 scale-105" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              )}
            >
              {isActive && <Icon className="w-3 h-3 animate-pulse" />}
              {cat}
            </button>
          );
        })}
      </div>
      
      {/* Fade effect on the right to show there's more to scroll */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default CategoryNav;