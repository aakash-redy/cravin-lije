import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, Minus, ShoppingBag, Utensils } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";

// --- Assets ---
import chaiLijeLogo from "@/assets/chai-lije-logo.png"; 

// --- Components ---
import CartDrawer from "@/components/CartDrawer";
import { cn } from "@/lib/utils";

// --- Types ---
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url?: string;
  description?: string;
  available: boolean;
  is_sugar_free_available?: boolean;
}

interface CartItem {
  uniqueKey: string;
  item: MenuItem;
  quantity: number;
  isSugarFree: boolean;
  instructions?: string;
}

// --- SUB-COMPONENT: MENU ITEM CARD ---
const MenuItemCard = ({ item, quantity, onAdd, onRemove }: { 
  item: MenuItem; 
  quantity: number; 
  onAdd: () => void; 
  onRemove: () => void; 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        "bg-white p-4 rounded-[1.25rem] border shadow-sm transition-all w-full",
        !item.available ? 'opacity-60 grayscale border-slate-100' : 'border-slate-100 active:scale-[0.98]'
      )}
    >
      <div className="flex justify-between items-center w-full gap-3">
        
        {/* Left Side: Name, Price */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <h4 className="font-bold text-base text-slate-900 leading-tight truncate">{item.name}</h4>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-base font-black text-slate-900">₹{item.price}</span>
          </div>
        </div>

        {/* Right Side: Add Button / Quantity */}
        <div className="shrink-0">
          {item.available ? (
            quantity > 0 ? (
               <div className="flex items-center bg-slate-50 rounded-lg p-1 gap-3 border border-slate-200 shadow-inner">
                 <button onClick={onRemove} className="w-8 h-8 bg-white text-slate-900 border border-slate-200 rounded flex items-center justify-center active:scale-90 transition-all shadow-sm"><Minus className="w-4 h-4" /></button>
                 <span className="font-black text-sm w-3 text-center">{quantity}</span>
                 <button onClick={onAdd} className="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center shadow-md active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
               </div>
            ) : (
               <button onClick={onAdd} className="h-9 px-5 bg-white border border-slate-200 text-emerald-600 font-black rounded-lg shadow-sm uppercase text-xs hover:bg-emerald-50 active:scale-95 transition-all">ADD</button>
            )
          ) : (
            <div className="h-9 px-3 bg-slate-100 text-slate-400 font-bold rounded-lg text-[10px] flex items-center justify-center uppercase border border-slate-200">Sold Out</div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

const MenuSkeleton = () => (
  <div className="space-y-4 p-4 mt-32">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[1.25rem] animate-pulse" />)}
  </div>
);

const Index = () => {
  const { shopId } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation(); 
  const { toast } = useToast();

  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const activeOrderId = location.state?.activeOrderId; 

  // Splash Screen Timer
  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('hasSeenSplash', 'true');
    }, 2500); 
    return () => clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    fetchMenu();
    const channel = supabase.channel('menu-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'menu_items' }, (payload) => {
        const updatedItem = payload.new as MenuItem;
        setMenuItems((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const fetchMenu = async () => {
    setLoading(true);
    let { data } = await supabase.from('menu_items').select('*').order('name');
    setMenuItems(data || []);
    setLoading(false);
  };

  const categories = useMemo(() => {
    if (menuItems.length === 0) return ["All"];
    const filtered = menuItems.filter(i => (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase())));
    const uniqueCats = [...new Set(filtered.map(i => i.category))];
    const PRIORITY_CAT = "Daily Specials";
    const hasPriority = uniqueCats.includes(PRIORITY_CAT);
    const otherCats = uniqueCats.filter(c => c !== PRIORITY_CAT).sort(); 
    return hasPriority ? ["All", PRIORITY_CAT, ...otherCats] : ["All", ...otherCats];
  }, [menuItems, searchQuery]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === "All") window.scrollTo({ top: 0, behavior: 'smooth' });
    else {
      const element = document.getElementById(category);
      if (element) {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
      }
    }
  };

  const addToCart = (item: MenuItem) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const uniqueKey = `${item.id}-reg`; 
    setCartItems(prev => {
      const existing = prev.find(i => i.uniqueKey === uniqueKey);
      if (existing) return prev.map(i => i.uniqueKey === uniqueKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { uniqueKey, item, quantity: 1, isSugarFree: false }];
    });
  };

  const removeFromCart = (itemId: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const uniqueKey = `${itemId}-reg`;
    setCartItems(prev => prev.map(i => i.uniqueKey === uniqueKey ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  };

  const handlePlaceOrder = async (customerName: string) => {
    if (cartItems.length === 0) return;
    const { data, error } = await supabase.from('orders').insert([{
        customer_name: customerName,
        total_amount: cartItems.reduce((sum, i) => sum + (i.item.price * i.quantity), 0),
        status: 'sent',
        order_items: cartItems.map(i => ({ item_id: i.item.id, item_name: i.item.name, quantity: i.quantity, price_at_time_of_order: i.item.price, is_sugar_free: i.isSugarFree, instructions: i.instructions }))
      }]).select().single();
    if (!error) {
      setCartItems([]); setIsCartOpen(false); navigate('/order-success', { state: { orderId: data.id, customerName, shopId } });
    } else toast({ title: "Order Failed", variant: "destructive" });
  };

  const getItemQuantity = (itemId: string) => cartItems.filter(i => i.item.id === itemId).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900"
          >
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              src={chaiLijeLogo} 
              alt="Chai Lije Logo" 
              className="w-48 h-auto object-contain bg-white rounded-3xl p-3 shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-emerald-500/30">
        
        {/* HEADER LAYOUT */}
        <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-xl pt-6 pb-4 shadow-sm border-b border-slate-200/60">
          <div className="flex gap-2 items-center px-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search chai, snacks..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm transition-all text-sm" 
              />
            </div>
          </div>

          {/* SCROLLABLE CHIPS */}
          <div className="flex overflow-x-auto gap-2 mt-4 px-4 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm whitespace-nowrap shrink-0",
                  activeCategory === cat 
                    ? "bg-slate-900 text-white" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE ORDER BANNER */}
        {activeOrderId && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 p-4 rounded-[1.25rem] flex items-center justify-between shadow-sm relative overflow-hidden"
          >
            {/* Soft background glow */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200 blur-2xl rounded-full opacity-50 pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md animate-pulse shrink-0">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Active Order</span>
                <span className="text-sm font-bold text-slate-900 leading-tight">Your food is in queue...</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/order-success', { state: { orderId: activeOrderId, shopId } })} 
              className="relative z-10 text-xs font-black bg-white px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 shadow-sm hover:bg-emerald-50 active:scale-95 transition-all shrink-0"
            >
              View
            </button>
          </motion.div>
        )}

        {/* MENU ITEMS GRID */}
        <div className="p-4 space-y-6 mt-2 min-h-[50vh]">
          {loading ? <MenuSkeleton /> : (
            <>
              {categories.filter(c => c !== "All").map((cat) => {
                const categoryItems = menuItems.filter(item => 
                  item.category === cat && 
                  (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                
                if (categoryItems.length === 0) return null;

                return (
                  <div key={cat} id={cat} className="scroll-mt-40">
                    <div className="flex items-center gap-2 mb-3 pl-1">
                      <div className={cn("h-5 w-1 rounded-full", cat === "Daily Specials" ? "bg-amber-400" : "bg-emerald-500")} />
                      <h3 className={cn("text-lg font-black leading-none", cat === "Daily Specials" ? "text-amber-600" : "text-slate-900")}>{cat}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {categoryItems.map((item) => (
                        <MenuItemCard key={item.id} item={item} quantity={getItemQuantity(item.id)} onAdd={() => addToCart(item)} onRemove={() => removeFromCart(item.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <CartDrawer 
          open={isCartOpen} 
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onAdd={(id, sf) => { const item = menuItems.find(i => i.id === id); if (item) addToCart(item); }}
          onRemove={(id) => removeFromCart(id)}
          onToggleSugar={(uk) => setCartItems(prev => prev.map(i => i.uniqueKey === uk ? { ...i, isSugarFree: !i.isSugarFree, uniqueKey: `${i.item.id}-${!i.isSugarFree ? 'sf' : 'reg'}` } : i))}
          onUpdateItemInstructions={(uk, note) => setCartItems(prev => prev.map(i => i.uniqueKey === uk ? { ...i, instructions: note } : i))}
          onPlaceOrder={handlePlaceOrder}
        />
        
        <AnimatePresence>
          {!isCartOpen && cartItems.length > 0 && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-4 right-4 z-30">
              <button onClick={() => setIsCartOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between border-t border-slate-800 active:scale-95 transition-transform">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border-2 border-slate-900">{cartItems.reduce((a, b) => a + b.quantity, 0)}</span>
                  <div className="text-left"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p><p className="text-2xl font-black leading-none">₹{cartItems.reduce((s, i) => s + (i.item.price * i.quantity), 0)}</p></div>
                </div>
                <span className="font-bold text-sm flex items-center gap-2 bg-slate-800 px-5 py-3 rounded-xl border border-slate-700">View Bag <ShoppingBag className="w-4 h-4 text-emerald-400" /></span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Index;