import { useState } from "react";
import { X, Minus, Plus, Sparkles, Leaf, MessageSquarePlus, Info, Check, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types compatible with Supabase Data ---
interface CartItem {
  uniqueKey: string;
  item: any; // Flexible for Supabase menu_items
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

const QUICK_TAGS = ["Less Sugar", "Strong", "No Milk", "Extra Hot"];

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
  const isSingleItem = cartItems.length === 1;

  // Logic for Badges
  const hasImmunityBoost = cartItems.some(
    (ci) => ci.item.category === "Immunity Boosters" || ci.item.name.toLowerCase().includes("ginger")
  );

  const handleSubmit = () => {
    if (!customerName.trim()) return;
    onPlaceOrder(customerName);
    setCustomerName("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[90vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 px-6 py-5 backdrop-blur-md flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6" /> Your Order
                </h2>
                {cartItems.length > 0 && (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {cartItems.length} Items • ₹{total}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 pb-12">
              {/* Smart Badges */}
              <div className="space-y-2 mb-8">
                {sugarFreeMode && (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 animate-in fade-in slide-in-from-top-2">
                    <Leaf className="h-5 w-5" /> 
                    <span>Sugar-Free Mode Active</span>
                  </div>
                )}
                {hasImmunityBoost && (
                  <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 animate-in fade-in slide-in-from-top-2">
                    <Sparkles className="h-5 w-5" /> 
                    <span>Immunity Boosters Included!</span>
                  </div>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center opacity-50">
                  <ShoppingBag className="w-20 h-20 mb-4 text-slate-300" />
                  <p className="text-xl font-bold text-slate-400">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((ci) => (
                    <div key={ci.uniqueKey} className="group relative space-y-3">
                      <div className="flex items-start justify-between rounded-3xl bg-slate-50 p-4 transition-all hover:bg-slate-100">
                        
                        {/* Item Details */}
                        <div className="flex-1">
                          <div className="flex flex-col gap-1">
                            <p className="font-black text-slate-900 text-lg">{ci.item.name}</p>
                            <div className="flex flex-wrap gap-2">
                              {ci.isSugarFree && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">SUGAR FREE</span>}
                              {ci.instructions && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1"><MessageSquarePlus className="w-3 h-3"/> NOTE ADDED</span>}
                            </div>
                            <p className="text-sm font-bold text-slate-400 mt-1">₹{ci.item.price} × {ci.quantity}</p>
                          </div>
                          
                          {/* Note Button */}
                          <button 
                            onClick={() => setActiveInstructionKey(activeInstructionKey === ci.uniqueKey ? null : ci.uniqueKey)}
                            className="mt-3 text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                          >
                            <MessageSquarePlus className="w-4 h-4" /> 
                            {ci.instructions ? "Edit Instructions" : "Add Note"}
                          </button>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                          <button onClick={() => onRemove(ci.item.id, ci.isSugarFree)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-900 font-bold transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[20px] text-center font-black">{ci.quantity}</span>
                          <button onClick={() => onAdd(ci.item.id, ci.isSugarFree)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-md hover:scale-105 transition-transform">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Instructions Panel */}
                      <AnimatePresence>
                        {(activeInstructionKey === ci.uniqueKey || (isSingleItem && !activeInstructionKey)) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-2 space-y-3 rounded-2xl border-2 border-indigo-50 bg-white p-4 shadow-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Special Instructions</span>
                                {!isSingleItem && <button onClick={() => setActiveInstructionKey(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-900">DONE</button>}
                              </div>
                              <textarea
                                value={ci.instructions || ""}
                                onChange={(e) => onUpdateItemInstructions(ci.uniqueKey, e.target.value)}
                                placeholder="E.g. Extra hot, less sugar..."
                                className="w-full resize-none rounded-xl bg-slate-50 p-3 text-sm font-medium outline-none border border-transparent focus:border-indigo-200 focus:bg-white transition-all"
                                rows={2}
                              />
                              <div className="flex flex-wrap gap-2">
                                {QUICK_TAGS.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => {
                                      const prev = ci.instructions || "";
                                      const newVal = prev.includes(tag) ? prev : prev ? `${prev}, ${tag}` : tag;
                                      onUpdateItemInstructions(ci.uniqueKey, newVal);
                                    }}
                                    className="rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Footer & Checkout */}
                  <div className="border-t border-dashed border-slate-200 pt-6 mt-4 space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="font-bold text-slate-400">Total Amount</span>
                      <span className="text-3xl font-black text-slate-900">₹{total}</span>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-3xl">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Order Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Who is this for?"
                        className="w-full rounded-xl border-none bg-white px-4 py-4 text-lg font-bold shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!customerName.trim()}
                        className="w-full relative overflow-hidden rounded-xl bg-slate-900 py-4 text-lg font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                      >
                        <span className="flex items-center justify-center gap-2">
                          CONFIRM ORDER <Check className="h-5 w-5" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;