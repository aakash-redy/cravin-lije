import { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, Check, ChefHat, Trash2, MessageSquarePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types ---
interface CartItem {
  uniqueKey: string;
  item: any; 
  quantity: number;
  isSugarFree: boolean;
  instructions?: string; // We store instructions on the item itself
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onAdd: (id: any, isSugarFree: boolean) => void;
  onRemove: (id: any, isSugarFree: boolean) => void;
  onToggleSugar?: (uniqueKey: string) => void;
  
  // New Prop to update specific item instructions
  onUpdateItemInstructions: (uniqueKey: string, instructions: string) => void; 
  
  onPlaceOrder: (name: string) => void; 
}

const QUICK_TAGS = ["Less Sugar", "Strong", "No Milk", "Extra Hot", "Spicy"];

// --- Helper Input Component (Prevents Focus Loss) ---
const InstructionInput = ({ 
  value, 
  onChange, 
  isBigMode 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  isBigMode: boolean;
}) => {
  return (
    <div className={cn("space-y-3", isBigMode ? "mt-4" : "mt-2")}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isBigMode ? "e.g. Less ice, extra spicy, make it hot..." : "Note for chef..."}
        className={cn(
          "w-full resize-none rounded-2xl bg-slate-50 p-3 font-bold text-slate-900 placeholder:text-slate-300 outline-none border-2 border-transparent focus:border-slate-900 transition-all",
          isBigMode ? "h-32 text-lg shadow-inner" : "h-20 text-xs"
        )}
      />
      {/* Quick Tags (Only show for big mode to save space in multi-item view) */}
      {isBigMode && (
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => onChange(value.includes(tag) ? value : value ? `${value}, ${tag}` : tag)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm hover:border-emerald-200 hover:text-emerald-600 active:scale-95 transition-all"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const CartDrawer = ({ 
  open, 
  onClose, 
  cartItems, 
  onAdd, 
  onRemove, 
  onToggleSugar,
  onUpdateItemInstructions,
  onPlaceOrder
}: CartDrawerProps) => {
  const [customerName, setCustomerName] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null); // Tracks which note is open in multi-mode

  // Logic to determine layout mode
  const isSingleItem = cartItems.length === 1;
  const total = cartItems.reduce((s, ci) => s + (ci.item.price * ci.quantity), 0);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (!open) setCustomerName("");
  }, [open]);

  const handleSubmit = () => {
    if (!customerName.trim()) return;
    onPlaceOrder(customerName);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] flex h-[90vh] flex-col rounded-t-[2.5rem] bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex-none border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-slate-900" /> Your Bag
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {cartItems.length === 0 ? "Empty" : `${cartItems.length} items`}
                  </p>
                </div>
                <button onClick={onClose} className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-40">
              {cartItems.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-xl font-black text-slate-900">Your bag is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((ci) => (
                    <div key={ci.uniqueKey} className={cn("group relative bg-white rounded-2xl", !isSingleItem && "pb-4 border-b border-dashed border-slate-100")}>
                      
                      {/* 1. Item Row */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <h3 className="font-black text-slate-900 text-lg leading-tight">{ci.item.name}</h3>
                          <p className="text-sm font-bold text-slate-400 mt-1">₹{ci.item.price * ci.quantity}</p>
                          
                          {/* Sugar Toggle */}
                          <div className="mt-3 flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={ci.isSugarFree}
                                onChange={() => onToggleSugar && onToggleSugar(ci.uniqueKey)}
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                              <span className={cn("ml-2 text-[10px] font-black uppercase tracking-wider", ci.isSugarFree ? "text-emerald-600" : "text-slate-400")}>
                                {ci.isSugarFree ? "Sugar Free" : "Regular"}
                              </span>
                            </label>
                          </div>

                          {/* MULTI ITEM: "Add Note" Button */}
                          {!isSingleItem && (
                            <button 
                              onClick={() => setActiveNoteId(activeNoteId === ci.uniqueKey ? null : ci.uniqueKey)}
                              className={cn(
                                "mt-3 text-xs font-bold flex items-center gap-1.5 transition-colors",
                                ci.instructions ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                              {ci.instructions ? <ChefHat className="w-3.5 h-3.5" /> : <MessageSquarePlus className="w-3.5 h-3.5" />}
                              {ci.instructions ? "Edit Note" : "Add cooking note"}
                            </button>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                          <button onClick={() => onAdd(ci.item.id, ci.isSugarFree)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-white active:scale-90 transition-all"><Plus className="h-4 w-4" /></button>
                          <span className="h-6 flex items-center justify-center font-black text-sm">{ci.quantity}</span>
                          <button onClick={() => onRemove(ci.item.id, ci.isSugarFree)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors">
                            {ci.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* 2. INSTRUCTION AREAS */}
                      
                      {/* SINGLE ITEM: Huge Box (Always Visible) */}
                      {isSingleItem && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                             <ChefHat className="w-5 h-5 text-emerald-500" />
                             <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Special Instructions</span>
                          </div>
                          <InstructionInput 
                            value={ci.instructions || ""}
                            onChange={(val) => onUpdateItemInstructions(ci.uniqueKey, val)}
                            isBigMode={true}
                          />
                        </div>
                      )}

                      {/* MULTI ITEM: Small Box (Toggled) */}
                      <AnimatePresence>
                        {!isSingleItem && activeNoteId === ci.uniqueKey && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <InstructionInput 
                              value={ci.instructions || ""}
                              onChange={(val) => onUpdateItemInstructions(ci.uniqueKey, val)}
                              isBigMode={false}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {cartItems.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-white p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 rounded-t-[2.5rem]">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-2">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Amount</span>
                     <span className="text-3xl font-black text-slate-900">₹{total}</span>
                  </div>

                  <div className="bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full rounded-2xl border-none bg-white px-5 py-4 text-center text-lg font-bold shadow-sm outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-slate-900 mb-2"
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={!customerName.trim()}
                      className="w-full relative overflow-hidden rounded-2xl bg-slate-900 py-4 text-lg font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                    >
                      <span className="flex items-center justify-center gap-2">
                        PAY ₹{total} <Check className="h-6 w-6" />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;