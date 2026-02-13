import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MenuCard from "@/components/MenuCard";
import CartDrawer from "@/components/CartDrawer";
import OrderSuccess from "@/components/OrderSuccess";
import AdminPortal from "@/components/AdminPortal";
import { menuItems as initialMenuItems, categories, categoryIcons, SUGAR_FREE_BLACKLIST } from "@/data/menuItems";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Lock, X, KeyRound } from "lucide-react";

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

  // --- Auth State ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");

  // --- Shop State ---
  const [search, setSearch] = useState("");
  const [sugarFreeOnly, setSugarFreeOnly] = useState(false);
  const [cart, setCart] = useState<Record<string, CartStateItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  // --- MENU DATA (Persisted) ---
  const [menuData, setMenuData] = useState(() => {
    if (typeof window !== "undefined") {
      const savedMenu = localStorage.getItem("cravin-menu-data");
      if (savedMenu) return JSON.parse(savedMenu);
    }
    return initialMenuItems.map(item => ({ ...item, available: true }));
  });

  useEffect(() => {
    localStorage.setItem("cravin-menu-data", JSON.stringify(menuData));
  }, [menuData]);

  // --- LIVE ORDERS (Persisted) ---
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

  // Sync Orders to LocalStorage
  useEffect(() => {
    const stringifiedState = JSON.stringify(liveOrders);
    const currentStorage = localStorage.getItem("cravin-live-orders");
    if (stringifiedState !== currentStorage) {
      localStorage.setItem("cravin-live-orders", stringifiedState);
    }
  }, [liveOrders]);

  // Sync across tabs
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

  // --- SOUND NOTIFICATION SYSTEM ---
  const prevOrderCount = useRef(liveOrders.length);

  useEffect(() => {
    // Only play sound if order count INCREASES (New Order)
    if (liveOrders.length > prevOrderCount.current) {
      // "Ting" Sound Effect
      const audio = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3");
      audio.play().catch(e => console.log("Audio prevented:", e));
      
      toast({ 
        title: "New Order!", 
        description: "Kitchen has been notified.",
        className: "bg-emerald-500 text-white border-none"
      });
    }
    prevOrderCount.current = liveOrders.length;
  }, [liveOrders]);

  // --- Logic ---
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([key, data]) => {
      const [idStr, isSugarFreeStr] = key.split("-");
      const itemData = menuData.find((m: any) => m.id === Number(idStr));
      
      if (!itemData) return undefined;

      return {
        uniqueKey: key,
        item: itemData, 
        quantity: data.quantity,
        instructions: data.instructions,
        isSugarFree: isSugarFreeStr === "true",
      };
    }).filter(ci => ci !== undefined);
  }, [cart, menuData]);

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
    // Updating liveOrders triggers the useEffect above, which plays the sound!
    setLiveOrders(prev => [newOrder, ...prev]);
    setCurrentOrderId(newOrder.id);
    setCart({});
    setCartOpen(false);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setLiveOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
  };

  const requestDelete = (id: string) => {
    setLiveOrders(prev => prev.filter(o => o.id !== id));
    toast({ title: "Order Deleted", variant: "destructive" });
  };

  const handleResetSystem = () => {
    setLiveOrders([]);
    localStorage.removeItem("cravin-live-orders");
    toast({ title: "System Reset", description: "Ready for a new day!" });
  };

  // --- ADMIN AUTH HANDLER ---
  const handleAdminLogin = () => {
    if (adminPin === "chai123") {
      setShowAdmin(true);
      setShowAuthModal(false);
      setAdminPin(""); // Clear pin
      toast({ title: "Welcome back, Chef!", description: "Admin mode unlocked." });
    } else {
      toast({ title: "Access Denied", description: "Incorrect PIN.", variant: "destructive" });
      setAdminPin("");
    }
  };

  // --- RENDER ---

  // 1. ADMIN VIEW
  if (showAdmin) {
    return (
      <AdminPortal 
        orders={liveOrders}
        menuItems={menuData}
        onUpdateStatus={updateOrderStatus} 
        onDelete={requestDelete} 
        onUpdateMenu={setMenuData}
        onBack={() => setShowAdmin(false)} // Go back to Customer View
        onResetSystem={handleResetSystem}
      />
    );
  }

  // 2. ORDER SUCCESS VIEW
  if (currentOrderId) {
    const activeOrder = liveOrders.find(o => o.id === currentOrderId);
    if (!activeOrder) { setCurrentOrderId(null); return null; }
    
    return (
      <OrderSuccess 
        name={activeOrder.customerName} 
        status={activeOrder.status} 
        onNewOrder={() => setCurrentOrderId(null)} 
      />
    );
  }

  // 3. MAIN CUSTOMER VIEW
  return (
    <div className={cn("min-h-screen pb-24 transition-colors duration-500", sugarFreeOnly ? "bg-emerald-50/40" : "bg-background")}>
      
      {/* Header with Double-Tap Secret Trigger */}
      <div onDoubleClick={() => setShowAuthModal(true)} className="cursor-pointer select-none">
        <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      </div>

      <SearchBar 
        value={search} 
        onChange={setSearch} 
        sugarFreeOnly={sugarFreeOnly} 
        onSugarFreeToggle={(val) => {
           const hasSweets = cartItems.some((ci: any) => SUGAR_FREE_BLACKLIST.includes(ci.item.name));
           if (val && hasSweets) toast({ title: "Clear Sweets First", description: "Remove sugary items first.", variant: "destructive" });
           else setSugarFreeOnly(val);
        }} 
      />

      <main className="container mx-auto px-4 py-8">
        {categories.map((cat) => {
          const items = menuData.filter((i: any) => 
            i.category === cat && 
            i.available && 
            (!sugarFreeOnly || !SUGAR_FREE_BLACKLIST.includes(i.name)) &&
            i.name.toLowerCase().includes(search.toLowerCase())
          );

          if (items.length === 0) return null;

          return (
            <section key={cat} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="mb-5 flex items-center gap-3 text-2xl font-black text-slate-800">
                <span className="text-3xl">{categoryIcons[cat]}</span> {cat}
              </h2>
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

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-6 flex justify-center animate-in slide-in-from-bottom-10 duration-500">
          <button 
            onClick={() => setCartOpen(true)} 
            className={cn("w-full max-w-lg rounded-[2.5rem] py-5 text-xl font-black shadow-2xl transition-all active:scale-95 flex items-center justify-between px-10 border-4 border-white", sugarFreeOnly ? "bg-emerald-600 text-white shadow-emerald-200" : "bg-slate-900 text-white shadow-slate-300")}
          >
            <span>View Cart ({cartCount})</span><span>₹{totalAmount}</span>
          </button>
        </div>
      )}

      <CartDrawer 
        open={cartOpen} 
        onClose={() => setCartOpen(false)} 
        cartItems={cartItems} 
        onAdd={addToCart} 
        onRemove={removeFromCart} 
        onUpdateItemInstructions={updateItemInstructions} 
        onPlaceOrder={handlePlaceOrder} 
        sugarFreeMode={sugarFreeOnly} 
      />

      {/* --- PIN AUTH MODAL --- */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white rounded-3xl p-8 shadow-2xl border border-white/20">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-3 rounded-full text-slate-900">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Admin Access</h3>
                  <p className="text-xs text-slate-500 font-medium">Enter security PIN</p>
                </div>
              </div>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Input Field */}
            <div className="relative mb-6 group">
              <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="password" 
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="PIN"
                autoFocus
                className="w-full bg-slate-50 text-center text-xl font-bold tracking-[0.5em] rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>

            {/* Unlock Button */}
            <button 
              onClick={handleAdminLogin}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              Unlock Portal
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;