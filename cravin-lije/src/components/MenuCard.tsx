import { Plus, Minus, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import type { MenuItem } from "@/data/menuItems";

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  sugarFreeMode?: boolean; // 1. Added the prop here
}

// 2. Extracted the prop here with a default value of false
const MenuCard = ({ item, quantity, onAdd, onRemove, sugarFreeMode = false }: MenuCardProps) => {
  
  // 3. Dynamic theme helpers for seamless color switching
  const themeText = sugarFreeMode ? "text-success" : "text-primary";
  const themeBg = sugarFreeMode ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground";
  const themeBorder = sugarFreeMode 
    ? "border-success text-success hover:bg-success hover:text-success-foreground" 
    : "border-primary text-primary hover:bg-primary hover:text-primary-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
    >
      <div className="flex-1 pr-3">
        <h3 className="font-semibold text-card-foreground">{item.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-accent">
          <Leaf className="h-3 w-3" />
          <em>{item.health_benefit}</em>
        </p>
        {/* Changed text color to be dynamic */}
        <span className={`mt-1.5 inline-block font-bold ${themeText}`}>
          ₹{item.price}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {quantity > 0 ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={onRemove}
              // Changed border and hover colors to be dynamic
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${themeBorder}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-semibold text-card-foreground">
              {quantity}
            </span>
          </motion.div>
        ) : null}
        <button
          onClick={onAdd}
          // Changed background color to be dynamic
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${themeBg}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default MenuCard;