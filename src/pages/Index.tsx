import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Leaf, Plus, Minus, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- Assets ---
import chaiLijeLogo from "@/assets/chai-lije-logo.png"; 

// --- Components ---
import CartDrawer from "@/components/CartDrawer";
import CategoryNav from "@/components/CategoryNav"; 
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
const MenuItemCard = ({ item, quantity, onAdd, onRemove, isSugarFreeMode }: { 
  item: MenuItem; 
  quantity: number; 
  onAdd: () => void; 
  onRemove: () => void; 
  isSugarFreeMode: boolean;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={cn(
        "bg-white p-4 rounded-[1.5rem] border shadow-sm flex justify-between items-start gap-4 transition-all",
        !item.available ? 'opacity-60 grayscale border-slate-100' : 'border-slate-100 active:scale-[0.98]'
      )}
    >
      <div className="flex-1">
        <h4 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h4>
        <p className="text-sm font-bold text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {item.description || "Freshly prepared with premium ingredients."}
        </p>
        
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-lg font-black text-slate-900">₹{item.price}</span>
          {item.is_sugar_free_available && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 transition-colors",
              isSugarFreeMode ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            )}>
              <Leaf className="w-3 h-3" /> {isSugarFreeMode ? "Sugar Free Applied" : "Sugar Free Option"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 pt-1">
        {item.available ? (
          quantity > 0 ? (
             <div className="flex flex-col items-center bg-slate-100 rounded-xl p-1 gap-2 shadow-inner">
               <button onClick={onAdd} className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
               <span className="font-black text-sm">{quantity}</span>
               <button onClick={onRemove} className="w-9 h-9 bg-white text-slate-900 border border-slate-200 rounded-lg flex items-center justify-center active:scale-90 transition-all"><Minus className="w-4 h-4" /></button>
             </div>
          ) : (
             <button onClick={onAdd} className="h-10 px-5 bg-white border-2 border-slate-100 text-emerald-600 font-black rounded-xl shadow-sm uppercase text-xs hover:bg-emerald-50 active:scale-95 transition-all">ADD</button>
          )
        ) : (
          <div className="h-10 px-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-[10px] flex items-center justify-center uppercase border border-slate-200">Sold Out</div>
        )}
      </div>
    </motion.div>
  );
};

const MenuSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[1.5rem] animate-pulse" />)}
  </div>
);

const Index = () => {
  const { shopId } = useParams(); 
  const navigate = useNavigate();
  const { toast } = useToast();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSugarFreeMode, setIsSugarFreeMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  // --- CHANGED: REMOVED DOUBLE TAP LOGIC ---
  const handleLogoClick = () => {
    // Just a simple interaction feedback, no secret access
    if (navigator.vibrate) navigator.vibrate(50);
  };

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

  // --- CUSTOM SORTING LOGIC ---
  const categories = useMemo(() => {
    if (menuItems.length === 0) return ["All"];
    
    // 1. Filter items based on search
    const filtered = menuItems.filter(i => (i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // 2. Get unique categories
    const uniqueCats = [...new Set(filtered.map(i => i.category))];
    
    // 3. Define the priority category
    const PRIORITY_CAT = "Daily Specials";

    // 4. Separate priority category from the rest
    const hasPriority = uniqueCats.includes(PRIORITY_CAT);
    const otherCats = uniqueCats.filter(c => c !== PRIORITY_CAT).sort(); // Sort others alphabetically

    // 5. Construct final array: All -> Daily Specials -> Others (A-Z)
    return hasPriority 
      ? ["All", PRIORITY_CAT, ...otherCats] 
      : ["All", ...otherCats];

  }, [menuItems, searchQuery]);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === "All") window.scrollTo({ top: 0, behavior: 'smooth' });
    else {
      const element = document.getElementById(category);
      if (element) {
        window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 180, behavior: 'smooth' });
      }
    }
  };

  const addToCart = (item: MenuItem, isSugarFree = false) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const uniqueKey = `${item.id}-${isSugarFree ? 'sf' : 'reg'}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.uniqueKey === uniqueKey);
      if (existing) return prev.map(i => i.uniqueKey === uniqueKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { uniqueKey, item, quantity: 1, isSugarFree }];
    });
  };

  const removeFromCart = (itemId: string, isSugarFree = false) => {
    if (navigator.vibrate) navigator.vibrate(20);
    const uniqueKey = `${itemId}-${isSugarFree ? 'sf' : 'reg'}`;
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
    <div className="min-h-screen bg-slate-50 pb-32 font-sans selection:bg-emerald-500/30">
      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-2xl relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div onClick={handleLogoClick} className="cursor-pointer active:scale-95 transition-transform flex items-center gap-3">
             <img src={chaiLijeLogo} alt="Chai Lije" className="h-14 w-auto object-contain bg-white rounded-xl p-1 shadow-lg" />
             <div className="flex flex-col">
               <span className="text-xl font-black leading-none tracking-tight">Cravin</span>
               <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">By Aakash</span>
             </div>
          </div>

          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              setIsSugarFreeMode(!isSugarFreeMode);
            }}
            className={cn(
              "flex items-center gap-3 px-4 h-14 rounded-2xl transition-all border-2 active:scale-95",
              isSugarFreeMode ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 border-slate-700 text-slate-400'
            )}
          >
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-black uppercase tracking-wider leading-none mb-1">Sugar Free</span>
              <span className={cn("text-[10px] font-bold leading-none", isSugarFreeMode ? 'text-emerald-100' : 'text-slate-500')}>
                {isSugarFreeMode ? 'MODE: ON' : 'MODE: OFF'}
              </span>
            </div>
            <div className={cn("p-1.5 rounded-lg transition-colors", isSugarFreeMode ? "bg-white/20" : "bg-slate-700")}>
              <Leaf className={cn("w-4 h-4", isSugarFreeMode ? "fill-white" : "")} />
            </div>
          </button>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" placeholder="Search chai, snacks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
        </div>
      </div>

      <div className="sticky top-0 z-40 -mt-6 pt-6 pointer-events-none"> 
        <div className="pointer-events-auto">
          <CategoryNav categories={categories} activeCategory={activeCategory} onSelect={handleCategoryClick} />
        </div>
      </div>

      <div className="p-4 space-y-8 mt-2 min-h-[50vh]">
        {loading ? <MenuSkeleton /> : (
          <>
            {/* This map will now follow the order: 
               1. Daily Specials (if exists)
               2. Others (A-Z)
            */}
            {categories.filter(c => c !== "All").map((cat) => {
              const categoryItems = menuItems.filter(item => 
                item.category === cat && 
                (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (isSugarFreeMode ? item.is_sugar_free_available : true)
              );
              
              if (categoryItems.length === 0) return null;

              return (
                <div key={cat} id={cat} className="scroll-mt-40">
                  <div className="flex items-center gap-3 mb-4 pl-2">
                    {/* Visual Emphasis for Daily Specials */}
                    <div className={cn("h-6 w-1 rounded-full", cat === "Daily Specials" ? "bg-amber-400" : "bg-emerald-500")} />
                    <h3 className={cn("text-xl font-black leading-none", cat === "Daily Specials" ? "text-amber-600" : "text-slate-900")}>{cat}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {categoryItems.map((item) => (
                      <MenuItemCard key={item.id} item={item} quantity={getItemQuantity(item.id)} onAdd={() => addToCart(item, isSugarFreeMode)} onRemove={() => removeFromCart(item.id, isSugarFreeMode)} isSugarFreeMode={isSugarFreeMode} />
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
        onAdd={(id, sf) => { const item = menuItems.find(i => i.id === id); if (item) addToCart(item, sf); }}
        onRemove={removeFromCart}
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
  );
};

export default Index;