import { useState, useCallback, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MenuCard from "@/components/MenuCard";
import CartDrawer from "@/components/CartDrawer";
import OrderSuccess from "@/components/OrderSuccess";
import AdminPortal from "@/components/AdminPortal";
import { menuItems as initialMenuItems, categories, categoryIcons, SUGAR_FREE_BLACKLIST } from "@/data/menuItems";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Trash2, RefreshCw, X, CheckCircle } from "lucide-react";

// --- Global Types ---
export type OrderStatus = "sent" | "preparing" | "ready";

interface CartStateItem {
  quantity: number;
  instructions: string;
}

interface Order {
  id: string;
  customerName: string;
  status: OrderStatus;
  items: any[];
  total: number;
  timestamp: Date;
}

const Index = () => {
  // --- View State ---
  const [showAdmin, setShowAdmin] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // --- Popups State ---
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showEndDaySummary, setShowEndDaySummary] = useState(false);

  // --- Shop State ---
  const [search, setSearch] = useState("");
  const [sugarFreeOnly, setSugarFreeOnly] = useState(false);
  const [cart, setCart] = useState<Record<string, CartStateItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  // --- MENU STATE (NEW: Editable Menu) ---
  const [menuData, setMenuData] = useState(() => {
    // Try to load saved menu from localStorage, otherwise use default data
    if (typeof window !== "undefined") {
      const savedMenu = localStorage.getItem("cravin-menu-data");
      if (savedMenu) {
        return JSON.parse(savedMenu);
      }
    }
    // Add 'available' property if not present
    return initialMenuItems.map(item => ({ ...item, available: true }));
  });

  // Save Menu changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("cravin-menu-data", JSON.stringify(menuData));
  }, [menuData]);


  // --- LIVE ORDERS STATE ---
  const [liveOrders, setLiveOrders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cravin-live-orders");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
        } catch (e) {
          console.error("Failed to parse orders", e);
        }
      }
    }
    return [];
  });

  // Safe Save Logic
  useEffect(() => {
    const stringifiedState = JSON.stringify(liveOrders);
    const currentStorage = localStorage.getItem("cravin-live-orders");
    if (stringifiedState !== currentStorage) {
      localStorage.setItem("cravin-live-orders", stringifiedState);
    }
  }, [liveOrders]);

  // Sync Logic
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cravin-live-orders" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLiveOrders(parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) })));
        } catch (error) { console.error("Sync error", error); }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // --- Logic ---
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([key, data]) => {
      const [idStr, isSugarFreeStr] = key.split("-");
      // Use menuData instead of menuItems to get updated prices
      const itemData = menuData.find((m: any) => m.id === Number(idStr));
      
      if (!itemData) return undefined; // Safety check if item deleted

      return {
        uniqueKey: key,
        item: itemData, 
        quantity: data.quantity,
        instructions: data.instructions,
        isSugarFree: isSugarFreeStr === "true",
      };
    }).filter(ci => ci !== undefined);
  }, [cart, menuData]); // Recalculate if menuData changes (price updates)

  const cartCount = useMemo(() => cartItems.reduce((s, ci: any) => s + ci.quantity, 0), [cartItems]);
  const totalAmount = useMemo(() => cartItems.reduce((s, ci: any) => s + ci.item.price * ci.quantity, 0), [cartItems]);

  // --- Handlers ---
  const addToCart = useCallback((id: number, sugarFree: boolean) => {
    const key = `${id}-${sugarFree}`;
    setCart(prev => ({ ...prev, [key]: { quantity: (prev[key]?.quantity || 0) + 1, instructions: prev[key]?.instructions || "" } }));
  }, []);

  const removeFromCart = useCallback((id: number, sugarFree: boolean) => {
    const key = `${id}-${sugarFree}`;
    setCart(prev => {
      const next = { ...prev };
      if (next[key]?.quantity > 1) next[key].quantity -= 1;
      else delete next[key];
      return next;
    });
  }, []);

  const updateItemInstructions = useCallback((key: string, val: string) => {
    setCart(prev => ({ ...prev, [key]: { ...prev[key], instructions: val } }));
  }, []);

  const handlePlaceOrder = (name: string) => {
    const newOrder: Order = {
      id: `ORD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      customerName: name, status: "sent", items: cartItems, total: totalAmount, timestamp: new Date(),
    };
    setLiveOrders(prev => [newOrder, ...prev]);
    setCurrentOrderId(newOrder.id);
    setCart({});
    setCartOpen(false);
    toast({ title: "Order Placed!", description: "Kitchen notified." });
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setLiveOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
  };

  const requestDelete = (id: string) => setOrderToDelete(id);
  const confirmDelete = () => {
    if (orderToDelete) {
      setLiveOrders(prev => prev.filter(o => o.id !== orderToDelete));
      setOrderToDelete(null);
      toast({ title: "Order Deleted", variant: "destructive" });
    }
  };

  const daySummary = useMemo(() => ({
    count: liveOrders.length,
    revenue: liveOrders.reduce((sum, o) => sum + o.total, 0)
  }), [liveOrders]);

  const confirmEndDay = () => {
    setLiveOrders([]);
    setShowEndDaySummary(false);
    localStorage.removeItem("cravin-live-orders");
    toast({ title: "Day Reset", description: "All orders cleared. Ready for tomorrow!" });
  };

  // --- VIEWS ---

  if (showAdmin) {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <AdminPortal 
          orders={liveOrders}
          menuItems={menuData} // Pass editable menu to Admin
          onUpdateStatus={updateOrderStatus} 
          onDelete={requestDelete} 
          onUpdateMenu={setMenuData} // Allow admin to update menu
        />

        <button onClick={() => setShowEndDaySummary(true)} className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-slate-800">
          <RefreshCw className="h-5 w-5" /> End Day
        </button>

        {/* --- Modals (Same as before) --- */}
        {orderToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Order?</h3>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setOrderToDelete(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white">Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {showEndDaySummary && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex justify-between items-start">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><CheckCircle className="h-8 w-8" /></div>
                <button onClick={() => setShowEndDaySummary(false)}><X className="h-6 w-6 text-slate-400" /></button>
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-900">End of Day Report</h2>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-center"><p className="text-sm font-bold text-slate-400">ORDERS</p><p className="mt-1 text-3xl font-black text-slate-900">{daySummary.count}</p></div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-center"><p className="text-sm font-bold text-emerald-600">REVENUE</p><p className="mt-1 text-3xl font-black text-emerald-700">₹{daySummary.revenue}</p></div>
              </div>
              <div className="mt-8"><button onClick={confirmEndDay} className="w-full rounded-xl bg-slate-900 py-4 font-bold text-white shadow-lg active:scale-95">Confirm & Reset System</button></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentOrderId) {
    const activeOrder = liveOrders.find(o => o.id === currentOrderId);
    if (!activeOrder) { setCurrentOrderId(null); return null; }
    return <OrderSuccess name={activeOrder.customerName} status={activeOrder.status} onNewOrder={() => setCurrentOrderId(null)} />;
  }

  return (
    <div className={cn("min-h-screen pb-24 transition-colors duration-500", sugarFreeOnly ? "bg-emerald-50/40" : "bg-background")}>
      <div onDoubleClick={() => setShowAdmin(true)} className="cursor-pointer select-none">
        <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      </div>
      <SearchBar value={search} onChange={setSearch} sugarFreeOnly={sugarFreeOnly} 
        onSugarFreeToggle={(val) => {
           const hasSweets = cartItems.some((ci: any) => SUGAR_FREE_BLACKLIST.includes(ci.item.name));
           if (val && hasSweets) toast({ title: "Clear Sweets First", description: "Remove sugary items first.", variant: "destructive" });
           else setSugarFreeOnly(val);
        }} 
      />
      <main className="container mx-auto px-4 py-8">
        {categories.map((cat) => {
          // CRITICAL: Filter based on 'menuData' state and the new 'available' property
          const items = menuData.filter((i: any) => 
            i.category === cat && 
            i.available && // Only show items marked as available
            (!sugarFreeOnly || !SUGAR_FREE_BLACKLIST.includes(i.name)) &&
            i.name.toLowerCase().includes(search.toLowerCase())
          );

          if (items.length === 0) return null;

          return (
            <section key={cat} className="mb-10">
              <h2 className="mb-5 flex items-center gap-3 text-2xl font-black"><span className="text-3xl">{categoryIcons[cat]}</span> {cat}</h2>
              <div className="grid gap-4">
                {items.map((item: any) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantity={cart[`${item.id}-${sugarFreeOnly}`]?.quantity || 0}
                    onAdd={() => addToCart(item.id, sugarFreeOnly)}
                    onRemove={() => removeFromCart(item.id, sugarFreeOnly)}
                    sugarFreeMode={sugarFreeOnly}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-6 flex justify-center">
          <button onClick={() => setCartOpen(true)} className={cn("w-full max-w-lg rounded-[2.5rem] py-5 text-xl font-black shadow-2xl transition-all active:scale-95 flex items-center justify-between px-10 border-4 border-white", sugarFreeOnly ? "bg-emerald-600 text-white" : "bg-slate-900 text-white")}>
            <span>View Cart ({cartCount})</span><span>₹{totalAmount}</span>
          </button>
        </div>
      )}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cartItems={cartItems} onAdd={addToCart} onRemove={removeFromCart} onUpdateItemInstructions={updateItemInstructions} onPlaceOrder={handlePlaceOrder} sugarFreeMode={sugarFreeOnly} />
    </div>
  );
};

export default Index;