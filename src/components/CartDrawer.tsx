import { useState, useEffect, useRef } from "react";
import { X, Minus, Plus, Sparkles, Leaf, MessageSquarePlus, ShoppingBag, Check, ChefHat, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types ---
interface CartItem {
  uniqueKey: string;
  item: any; 
  quantity: number;
  isSugarFree: boolean;
  instructions?: string;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onAdd: (id: any, isSugarFree: boolean) => void;
  onRemove: (id: any, isSugarFree: boolean) => void;
  onUpdateItemInstructions: (uniqueKey: string, instructions: string) => void;
  onPlaceOrder: (name: string) => void;
  sugarFreeMode?: boolean;
}

const QUICK_TAGS = ["Less Sugar", "Strong", "No Milk", "Extra Hot", "Spicy"];

// --- Sub-Component to Fix Input Bug ---
// This isolates the typing state so it doesn't re-render the whole cart on every keystroke
const InstructionInput = ({ 
  initialValue, 
  onSave,
  uniqueKey
}: { 
  initialValue: string; 
  onSave: (val: string) => void;
  uniqueKey: string;
}) => {
  const [value, setValue] = useState(initialValue);

  // Sync local state if parent prop changes externally
  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(value)} // Only update parent when user is done typing
        placeholder="e.g. Extra hot, less sugar..."
        className="w-full resize-none rounded-xl bg-slate-50 p-3 text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
        rows={2}
      />
      {/* Quick Tags */}
      <div className="flex flex-wrap gap-2">
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              const newVal = value.includes(tag) ? value : value ? `${value}, ${tag}` : tag;
              setValue(newVal);
              onSave(newVal);
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-500 shadow-sm hover:border-indigo-200 hover:text-indigo-600 hover:scale-105 active:scale-95 transition-all"
          >
            + {tag}
          </button>
        ))}
      </div>
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
  onUpdateItemInstructions,
  onPlaceOrder, 
  sugarFreeMode = false 
}: CartDrawerProps) => {
  const [activeInstructionKey, setActiveInstructionKey] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  // Calculate Total
  const total = cartItems.reduce((s, ci) => s + (ci.item.price * ci.quantity), 0);
  
  // Logic for Badges
  const hasImmunityBoost = cartItems.some(
    (ci) => ci.item.category === "Immunity Boosters" || ci.item.name.toLowerCase().includes("ginger")
  );

  const handleSubmit = () => {
    if (!customerName.trim()) return;
    onPlaceOrder(customerName);
    setCustomerName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] flex h-[92vh] flex-col rounded-t-[2.5rem] bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex-none border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-indigo-600" /> 
                    Your Bag
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    Cravin • {cartItems.length} Items
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="rounded-full bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Smart Badges */}
              <div className="space-y-3 mb-8">
                {sugarFreeMode && (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 border border-emerald-100">
                    <Leaf className="h-5 w-5" /> 
                    <span>Sugar-Free Mode Active</span>
                  </div>
                )}
                {hasImmunityBoost && (
                  <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 border border-amber-100">
                    <Sparkles className="h-5 w-5" /> 
                    <span>Immunity Boosters Included!</span>
                  </div>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <ShoppingBag className="w-10 h-10 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900">Your bag is empty</p>
                    <p className="text-sm font-medium text-slate-400 mt-1">Add some delicious items to start!</p>
                  </div>
                  <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm">
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="space-y-6 pb-20">
                  {cartItems.map((ci) => (
                    <div key={ci.uniqueKey} className="group relative">
                      <div className="flex items-start justify-between">
                        
                        {/* Item Info */}
                        <div className="flex-1 pr-4">
                          <div className="flex flex-col gap-1">
                            <p className="font-black text-slate-900 text-lg leading-tight">{ci.item.name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {ci.isSugarFree && (
                                <span className="text-[10px] font-black tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                                  SUGAR FREE
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-slate-400 mt-1">₹{ci.item.price}</p>
                            
                            {/* Toggle Instructions */}
                            <button 
                              onClick={() => setActiveInstructionKey(activeInstructionKey === ci.uniqueKey ? null : ci.uniqueKey)}
                              className={cn(
                                "mt-3 text-xs font-bold flex items-center gap-1.5 transition-colors",
                                ci.instructions ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                              {ci.instructions ? (
                                <>
                                  <ChefHat className="w-4 h-4" /> 
                                  <span className="line-clamp-1 text-left">{ci.instructions}</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquarePlus className="w-4 h-4" /> 
                                  Add cooking note
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                          <button 
                            onClick={() => onAdd(ci.item.id, ci.isSugarFree)} 
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:scale-105 active:scale-95 transition-all"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className="h-6 flex items-center justify-center font-black text-sm">{ci.quantity}</span>
                          <button 
                            onClick={() => onRemove(ci.item.id, ci.isSugarFree)} 
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            {ci.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Instructions Panel (Animated) */}
                      <AnimatePresence>
                        {activeInstructionKey === ci.uniqueKey && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-1">
                              <div className="rounded-2xl border-2 border-indigo-50 bg-white p-4 shadow-xl relative">
                                <div className="absolute top-0 left-4 -translate-y-1/2 bg-indigo-50 px-2 py-0.5 rounded-md">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Kitchen Note</span>
                                </div>
                                <InstructionInput 
                                  uniqueKey={ci.uniqueKey}
                                  initialValue={ci.instructions || ""}
                                  onSave={(val) => onUpdateItemInstructions(ci.uniqueKey, val)}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Divider */}
                      <div className="mt-6 border-b border-dashed border-slate-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {cartItems.length > 0 && (
              <div className="flex-none bg-white p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                <div className="flex justify-between items-end mb-4 px-1">
                  <span className="text-sm font-bold text-slate-400">Total to pay</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tight">₹{total}</span>
                </div>

                <div className="space-y-3 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                  <div className="relative">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full rounded-2xl border-none bg-white px-5 py-4 text-center text-lg font-bold shadow-sm outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!customerName.trim()}
                    className="w-full relative overflow-hidden rounded-2xl bg-slate-900 py-4 text-lg font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                  >
                    <span className="flex items-center justify-center gap-2">
                      PLACE ORDER <Check className="h-6 w-6" />
                    </span>
                  </button>
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