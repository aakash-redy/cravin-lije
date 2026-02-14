import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import MenuCard from "@/components/MenuCard";
import CartDrawer from "@/components/CartDrawer";
import OrderSuccess from "@/components/OrderSuccess";
import AdminPortal from "@/components/AdminPortal";
import { supabase } from "../lib/supabase"; 
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Index = () => {
  // --- 1. DATABASE STATE ---
  const [menuData, setMenuData] = useState<any[]>([]); 
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 2. UI & AUTH STATE ---
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sugarFreeOnly, setSugarFreeOnly] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState<Record<string, any>>({});
  const [cartOpen, setCartOpen] = useState(false);

  // --- 3. DATA FETCHING LOGIC ---
  const fetchMenu = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });
    
    if (data) setMenuData(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('is_archived', false) // Only active orders
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Prevents UI flickering by checking if data actually changed
      setLiveOrders(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
    }
    setLoading(false);
  };

  // --- 4. THE SYNC SYSTEM (Real-time + Safety Polling) ---
  useEffect(() => {
    fetchMenu();
    fetchOrders();

    // Layer 1: Real-time Listener (The "Ting" Sound)
    const channel = supabase
      .channel('live-updates')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            new Audio("https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3").play().catch(() => {});
          }
          fetchOrders(); 
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'menu_items' }, 
        fetchMenu
      )
      .subscribe();

    // Layer 2: Aggressive Polling Safety Net
    // Force-refreshes every 2 seconds in case the network blocks WebSockets
    const interval = setInterval(fetchOrders, 2000); 

    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval); 
    };
  }, []);

  // --- 5. CART CALCULATIONS ---
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([key, data]) => {
      // Correctly splits IDs (works for both Numbers and UUIDs)
      const lastDashIndex = key.lastIndexOf("-");
      const id = key.substring(0, lastDashIndex);
      const isSugarFree = key.substring(lastDashIndex + 1) === "true";

      const item = menuData.find((m: any) => String(m.id) === String(id));
      if (!item) return null;

      return { 
        uniqueKey: key, 
        item, 
        quantity: data.quantity, 
        instructions: data.instructions || "", 
        isSugarFree 
      };
    }).filter((i): i is any => i !== null);
  }, [cart, menuData]);

  const totalAmount = useMemo(() => cartItems.reduce((s, ci) => s + (ci.item.price * ci.quantity), 0), [cartItems]);

  // --- 6. ACTION HANDLERS ---
  const addToCart = (id: any, sf: boolean) => {
    const key = `${id}-${sf}`;
    setCart(prev => ({ ...prev, [key]: { ...prev[key], quantity: (prev[key]?.quantity || 0) + 1 } }));
  };

  const removeFromCart = (id: any, sf: boolean) => {
    const key = `${id}-${sf}`;
    setCart(prev => {
      if (!prev[key] || prev[key].quantity <= 1) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { ...prev[key], quantity: prev[key].quantity - 1 } };
    });
  };

  const handlePlaceOrder = async (name: string) => {
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{ customer_name: name, total_amount: totalAmount, status: 'sent', is_archived: false }])
      .select()
      .single();

    if (error) return toast({ title: "Order Failed", description: error.message, variant: "destructive" });

    const items = cartItems.map(ci => ({
      order_id: order.id,
      menu_item_id: ci.item.id,
      item_name: ci.item.name,
      quantity: ci.quantity,
      is_sugar_free: ci.isSugarFree,
      price_at_time_of_order: ci.item.price
    }));

    await supabase.from('order_items').insert(items);
    
    setCurrentOrderId(order.id);
    setCart({});
    setCartOpen(false);
    fetchOrders();
  };

  // --- 7. RENDER LOGIC ---
  if (showAdmin) {
    return (
      <AdminPortal 
        orders={liveOrders} 
        menuItems={menuData} 
        onUpdateStatus={async (id, s) => { await supabase.from('orders').update({ status: s }).eq('id', id); fetchOrders(); }} 
        onDelete={async (id) => { await supabase.from('orders').delete().eq('id', id); fetchOrders(); }} 
        onUpdateMenu={fetchMenu} 
        onBack={() => setShowAdmin(false)} 
        onResetSystem={async () => { await supabase.from('orders').update({ is_archived: true }).eq('is_archived', false); fetchOrders(); }} 
      />
    );
  }

  if (currentOrderId) {
    const order = liveOrders.find(o => o.id === currentOrderId);
    return <OrderSuccess name={order?.customer_name || "Guest"} status={order?.status || 'sent'} onNewOrder={() => setCurrentOrderId(null)} />;
  }

  return (
    <div className={cn("min-h-screen pb-32 transition-colors duration-500", sugarFreeOnly ? "bg-emerald-50" : "bg-slate-50")}>
      
      <div onDoubleClick={() => setShowAuthModal(true)} className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <Header cartCount={cartItems.length} onCartClick={() => setCartOpen(true)} />
        <div className="px-4 pb-4">
          <SearchBar value={search} onChange={setSearch} sugarFreeOnly={sugarFreeOnly} onSugarFreeToggle={setSugarFreeOnly} />
        </div>
      </div>
      
      <main className="p-4 container mx-auto max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Loading Menu...</p>
          </div>
        ) : (
          Array.from(new Set(menuData.map(i => i.category))).map(cat => (
            <section key={cat} className="mb-6">
              <h2 className="text-lg font-black mb-3 text-slate-800 uppercase tracking-tight pl-1">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {menuData.filter(i => i.category === cat && (i.name?.toLowerCase().includes(search.toLowerCase()) ?? true)).map(item => (
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
          ))
        )}
      </main>

      {cartItems.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-40 md:inset-x-auto md:right-8 md:w-96">
          <button onClick={() => setCartOpen(true)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-transform flex items-center justify-between px-6">
            <span className="flex items-center gap-2">
              <span className="bg-white text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{cartItems.length}</span>
              Items
            </span>
            <span>View Cart • ₹{totalAmount}</span>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cartItems={cartItems} onAdd={addToCart} onRemove={removeFromCart} onUpdateItemInstructions={() => {}} onPlaceOrder={handlePlaceOrder} sugarFreeMode={sugarFreeOnly} />

      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-xs bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h3 className="text-xl font-black mb-6">Owner Access</h3>
            <input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="PIN" className="w-full bg-slate-100 text-center py-4 rounded-xl mb-4 text-3xl font-black outline-none focus:ring-2 focus:ring-slate-900" autoFocus />
            <button onClick={() => adminPin === 'chai123' ? (setShowAdmin(true), setShowAuthModal(false), setAdminPin("")) : toast({ title: "Incorrect PIN", variant: "destructive" })} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black shadow-lg">UNLOCK</button>
            <button onClick={() => setShowAuthModal(false)} className="py-4 text-slate-400 font-bold text-xs uppercase">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;