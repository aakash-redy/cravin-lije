import { Plus, Minus, Leaf, Flame, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  item: any; // Flexible type for Supabase data
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  sugarFreeMode?: boolean;
}

const MenuCard = ({ item, quantity, onAdd, onRemove, sugarFreeMode = false }: MenuCardProps) => {
  
  // 1. Smart Health Benefit Generator
  // Since the database might not have a 'health_benefit' column yet, we infer it dynamically.
  const getBenefit = () => {
    if (item.category === "Immunity Boosters") return "Boosts immune system";
    if (item.name.toLowerCase().includes("ginger")) return "Soothing for throat";
    if (item.name.toLowerCase().includes("tulasi")) return "Natural detox";
    if (sugarFreeMode) return "Zero refined sugar";
    return "Freshly brewed";
  };

  // 2. Dynamic Theme Classes
  const theme = sugarFreeMode 
    ? {
        border: "border-emerald-100",
        bg: "bg-emerald-50/50",
        text: "text-emerald-900",
        icon: "text-emerald-600",
        accent: "text-emerald-700",
        btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
        btnBorder: "border-emerald-200 text-emerald-700 hover:bg-emerald-100",
        highlight: "bg-emerald-100 text-emerald-800"
      }
    : {
        border: "border-slate-100",
        bg: "bg-white",
        text: "text-slate-900",
        icon: "text-amber-500",
        accent: "text-slate-500",
        btnBg: "bg-slate-900 hover:bg-slate-800 text-white",
        btnBorder: "border-slate-200 text-slate-600 hover:bg-slate-100",
        highlight: "bg-amber-100 text-amber-800"
      };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start justify-between rounded-2xl p-4 border shadow-sm transition-all duration-300",
        theme.border,
        theme.bg
      )}
    >
      {/* Left Side: Info */}
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-1">
          {item.category === "Immunity Boosters" && <Sparkles className="w-3 h-3 text-amber-500" />}
          {sugarFreeMode && <Leaf className="w-3 h-3 text-emerald-500" />}
          <span className={cn("text-[10px] font-black uppercase tracking-wider", theme.accent)}>
            {item.category || "General"}
          </span>
        </div>
        
        <h3 className={cn("font-black text-lg leading-tight", theme.text)}>
          {item.name}
        </h3>
        
        <p className={cn("mt-1 flex items-center gap-1.5 text-xs font-medium", theme.accent)}>
          {sugarFreeMode ? <Leaf className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
          <span>{getBenefit()}</span>
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className={cn("text-base font-black", theme.text)}>₹{item.price}</span>
          {quantity > 0 && (
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold animate-in zoom-in", theme.highlight)}>
              {quantity} in cart
            </span>
          )}
        </div>
      </div>

      {/* Right Side: Stepper Controls */}
      <div className="flex items-center gap-3 self-center">
        {quantity > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onRemove}
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-xl border transition-colors active:scale-90",
              theme.btnBorder
            )}
          >
            <Minus className="h-4 w-4" />
          </motion.button>
        )}

        <motion.button
          onClick={onAdd}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-xl shadow-md transition-all active:scale-90",
            theme.btnBg,
            quantity > 0 ? "w-9" : "w-12" // Expands slightly when it's the only button
          )}
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MenuCard;