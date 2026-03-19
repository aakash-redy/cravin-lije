import { useState } from "react";
import { X, Minus, Plus, Sparkles, Leaf, MessageSquarePlus, Info, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MenuItem } from "@/data/menuItems";
import { SUGAR_FREE_BLACKLIST } from "@/data/menuItems";

interface CartItem {
  uniqueKey: string;
  item: MenuItem;
  quantity: number;
  isSugarFree: boolean;
  instructions?: string;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onAdd: (id: number, isSugarFree: boolean) => void;
  onRemove: (id: number, isSugarFree: boolean) => void;
  onUpdateItemInstructions: (uniqueKey: string, instructions: string) => void;
  onPlaceOrder: (name: string, instructions: string) => void;
  sugarFreeMode?: boolean;
}

const QUICK_TAGS = ["Less Sugar", "Strong", "No Milk"];

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
  const [globalInstructions, setGlobalInstructions] = useState("");
  const [activeInstructionKey, setActiveInstructionKey] = useState<string | null>(null);

  const total = cartItems.reduce((s, ci) => s + ci.item.price * ci.quantity, 0);
  const isSingleItem = cartItems.length === 1;

  const hasImmunityBoost = cartItems.some(
    (ci) => ci.item.name.includes("Ginger") || ci.item.name.includes("Masala")
  );

  const getDisplayName = (ci: CartItem): string => {
    if (ci.isSugarFree && !SUGAR_FREE_BLACKLIST.includes(ci.item.name)) {
      return `${ci.item.name} (Sugar Free)`;
    }
    return ci.item.name;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "Friend";
    // For multiple items, we rely on the state held in the parent for each item
    onPlaceOrder(name, isSingleItem ? globalInstructions : "");
    setGlobalInstructions("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-card shadow-2xl"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-card-foreground">Your Order</h2>
                  {!isSingleItem && cartItems.length > 0 && (
                    <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Info className="h-3 w-3" /> Tap icon to customize each item
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Contextual Badges */}
              <div className="space-y-2 mb-6">
                {sugarFreeMode && (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                    <Leaf className="h-4 w-4" /> 🍃 Sugar-Free Preparation Active
                  </div>
                )}
                {hasImmunityBoost && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                    <Sparkles className="h-4 w-4" /> ✨ Immunity-boosting ingredients included!
                  </div>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">Your cart is feeling a bit light...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((ci) => (
                    <div key={ci.uniqueKey} className="group relative space-y-3">
                      <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4 transition-colors group-hover:bg-muted/60">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-card-foreground">{getDisplayName(ci)}</p>
                            
                            {!isSingleItem && (
                              <button 
                                onClick={() => setActiveInstructionKey(activeInstructionKey === ci.uniqueKey ? null : ci.uniqueKey)}
                                className={`flex items-center gap-1.5 rounded-full px-2 py-1 transition-all ${
                                  ci.instructions 
                                    ? 'bg-primary text-primary-foreground scale-105 shadow-md' 
                                    : 'bg-background/50 text-muted-foreground border border-dashed border-border hover:border-primary hover:text-primary'
                                }`}
                              >
                                <MessageSquarePlus className="h-3.5 w-3.5" />
                                {!ci.instructions && <span className="text-[10px] font-bold uppercase">Add Note</span>}
                                {ci.instructions && <Check className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-bold text-primary">₹{ci.item.price} × {ci.quantity}</p>
                        </div>

                        <div className="flex items-center gap-3 rounded-full bg-background p-1 shadow-sm">
                          <button onClick={() => onRemove(ci.item.id, ci.isSugarFree)} className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-[20px] text-center text-sm font-bold">{ci.quantity}</span>
                          <button onClick={() => onAdd(ci.item.id, ci.isSugarFree)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-90">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Individual Special Instructions Panel */}
                      <AnimatePresence>
                        {activeInstructionKey === ci.uniqueKey && !isSingleItem && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mx-2 space-y-3 rounded-2xl border-2 border-primary/20 bg-background p-4 shadow-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-primary">Special Instructions</span>
                                <button onClick={() => setActiveInstructionKey(null)} className="text-[10px] font-bold text-muted-foreground hover:text-primary">DONE</button>
                              </div>
                              <textarea
                                autoFocus
                                value={ci.instructions || ""}
                                onChange={(e) => onUpdateItemInstructions(ci.uniqueKey, e.target.value)}
                                placeholder="E.g. Extra hot, very strong, no sugar..."
                                className="w-full resize-none rounded-lg bg-muted/30 p-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                                rows={2}
                              />
                              <div className="flex flex-wrap gap-2">
                                {QUICK_TAGS.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      const prev = ci.instructions || "";
                                      const newVal = prev.includes(tag) ? prev : prev ? `${prev}, ${tag}` : tag;
                                      onUpdateItemInstructions(ci.uniqueKey, newVal);
                                    }}
                                    className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                  >
                                    +{tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-border pt-6">
                    <span className="text-lg font-bold text-card-foreground">Grand Total</span>
                    <span className="text-2xl font-black text-primary">₹{total}</span>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Name</label>
                      <input
                        name="name"
                        type="text"
                        placeholder="Who is this for?"
                        required
                        className="w-full rounded-xl border border-input bg-muted/20 px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    {/* Big Box for Single Item Only */}
                    {isSingleItem && (
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Special Instructions</label>
                        <textarea
                          value={globalInstructions}
                          onChange={(e) => setGlobalInstructions(e.target.value)}
                          placeholder="Less sugar, extra hot, etc..."
                          rows={3}
                          className="w-full rounded-xl border border-input bg-muted/20 px-4 py-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex flex-wrap gap-2">
                          {QUICK_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setGlobalInstructions(prev => prev.includes(tag) ? prev : prev ? `${prev}, ${tag}` : tag)}
                              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                                globalInstructions.includes(tag) 
                                  ? "border-primary bg-primary text-primary-foreground" 
                                  : "border-border text-muted-foreground hover:border-primary"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="group relative w-full overflow-hidden rounded-2xl bg-primary py-4 text-lg font-black text-primary-foreground shadow-lg transition-all active:scale-95"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Confirm Order — ₹{total}
                        <Check className="h-5 w-5" />
                      </span>
                    </button>
                  </form>
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