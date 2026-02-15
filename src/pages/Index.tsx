import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Leaf, Loader2, Plus, Minus, ShoppingBag, Sparkles, AlertCircle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- Assets ---
import chaiLijeLogo from "@/assets/chai-lije-logo.png";

// --- Components ---
import CartDrawer from "@/components/CartDrawer";
import CategoryNav from "@/components/CategoryNav"; 

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
      viewport={{ once: true }}
      className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex justify-between items-start gap-4 transition-all active:scale-[0.99]"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
           <h4 className="font-bold text-lg text-slate-900 leading-tight">{item.name}</h4>
        </div>
        
        <p className="text-sm font-bold text-slate-400 mt-1 line-clamp-2">
          {item.description || "Freshly prepared with premium ingredients."}
        </p>
        
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-black text-slate-900">₹{item.price}</span>
          {isSugarFreeMode && item.is_sugar_free_available && (
             <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
               <Leaf className="w-3 h-3" /> Sugar Free
             </span>
          )}
          {!item.available && (
             <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">
               Sold Out
             </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        {item.available ? (
          quantity > 0 ? (
             <div className="flex flex-col items-center bg-slate-100 rounded-xl p-1 gap-2">
               <button onClick={onAdd} className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold shadow-md hover:scale-110 transition-transform">
                 <Plus className="w-4 h-4" />
               </button>
               <span className="font-black text-sm">{quantity}</span>
               <button onClick={onRemove} className="w-8 h-8 bg-white text-slate-900 border border-slate-200 rounded-lg flex items-center justify-center font-bold hover:bg-red-50 hover:text-red-500 transition-colors">
                 <Minus className="w-4 h-4" />
               </button>
             </div>
          ) : (
             <button 
               onClick={onAdd}
               className="h-10 px-4 bg-white border-2 border-slate-100 text-emerald-600 font-black rounded-xl shadow-sm uppercase text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
             >
               ADD
             </button>
          )
        ) : (
          <div className="h-10 px-2 bg-slate-100 text-slate-400 font-bold rounded-xl text-[10px] flex items-center justify-center uppercase">
            Out of Stock
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
const Index = () => {
  const { shopId } = useParams(); 
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- State ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSugarFreeMode, setIsSugarFreeMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  // --- SECRET ADMIN DOOR LOGIC ---
  const [tapCount, setTapCount] = useState(0);

  const handleLogoClick = () => {
    setTapCount(prev => prev + 1);
    
    // Reset tap count after 1 second
    setTimeout(() => setTapCount(0), 1000);

    if (tapCount + 1 === 2) { 
      toast({ title: "Secret Access", description: "Entering Admin Portal..." });
      navigate('/admin');
    }
  };

  // --- Fetch Data ---
  useEffect(() => {
    fetchMenu();

    const channel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'menu_items' }, 
        (payload) => {
          const updatedItem = payload.new as MenuItem;
          setMenuItems((prev) => 
            prev.map(item => item.id === updatedItem.id ? updatedItem : item)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [shopId]);

  const fetchMenu = async () => {
    setLoading(true);
    let query = supabase.from('menu_items').select('*').order('name');
    const { data } = await query;
    setMenuItems(data || []);
    setLoading(false);
  };

  // --- Categories & Search ---
  const categories = useMemo(() => {
    if (menuItems.length === 0) return ["All"];
    const filtered = menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const cats = [...new Set(filtered.map(i => i.category))];
    return ["All", ...cats.sort()];
  }, [menuItems, searchQuery]);

  // --- Scroll Logic ---
  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (category === "All") window.scrollTo({ top: 0, behavior: 'smooth' });
    else {
      const element = document.getElementById(category);
      if (element) {
        const offset = 180; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        window.scrollTo({ top: elementRect - bodyRect - offset, behavior: 'smooth' });
      }
    }
  };

  // --- Cart Logic ---
  const addToCart = (item: MenuItem, isSugarFree = false) => {
    const uniqueKey = `${item.id}-${isSugarFree ? 'sf' : 'reg'}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.uniqueKey === uniqueKey);
      if (existing) return prev.map(i => i.uniqueKey === uniqueKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { uniqueKey, item, quantity: 1, isSugarFree }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string, isSugarFree = false) => {
    const uniqueKey = `${itemId}-${isSugarFree ? 'sf' : 'reg'}`;
    setCartItems(prev => prev.map(i => i.uniqueKey === uniqueKey ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  };

  const handlePlaceOrder = async (customerName: string) => {
    if (cartItems.length === 0) return;
    const totalAmount = cartItems.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);
    
    // JSONB Way
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_name: customerName,
        total_amount: totalAmount,
        status: 'sent',
        order_items: cartItems.map(i => ({
          item_id: i.item.id,
          item_name: i.item.name,
          quantity: i.quantity,
          price_at_time_of_order: i.item.price,
          is_sugar_free: i.isSugarFree,
          instructions: i.instructions
        }))
      }])
      .select()
      .single();

    if (!error) {
      setCartItems([]);
      setIsCartOpen(false);
      navigate('/order-success', { state: { orderId: data.id, customerName, shopId } });
    } else {
      toast({ title: "Error", description: "Order failed. Try again.", variant: "destructive" });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const getItemQuantity = (itemId: string) => cartItems.filter(i => i.item.id === itemId).reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      
      {/* --- HEADER --- */}
      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-xl relative z-10">
        <div className="flex justify-between items-center mb-6">
          
          {/* LOGO & DEVELOPER BADGE */}
          <div onClick={handleLogoClick} className="cursor-pointer active:scale-95 transition-transform select-none flex items-center gap-3">
             <img 
               src={chaiLijeLogo} 
               alt="Chai Lije" 
               className="h-14 w-auto object-contain bg-white rounded-xl p-1" 
             />
             <div className="flex flex-col">
               {/* 1. App Name */}
               <span className="text-lg font-black leading-none">Cravin</span>
               
               {/* 2. Developer Credentials (Visible but unobtrusive) */}
               <div className="flex flex-col mt-1">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created by Aakash</span>
                 <a 
                   href="tel:+919640235706" // 👈 REPLACE THIS WITH YOUR NUMBER
                   onClick={(e) => e.stopPropagation()} // Prevents triggering Admin door when clicking phone
                   className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-white transition-colors mt-0.5"
                 >
                   <Phone className="w-2.5 h-2.5" /> Contact Dev
                 </a>
               </div>
             </div>
          </div>

          {/* 3. SUGAR TOGGLE */}
          <button 
            onClick={() => setIsSugarFreeMode(!isSugarFreeMode)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all border-2 ${
              isSugarFreeMode 
              ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Leaf className="w-6 h-6 mb-1" />
            <span className="text-[8px] font-black uppercase">{isSugarFreeMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search chai, coffee, snacks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* --- STICKY NAV --- */}
      <div className="sticky top-0 z-40 -mt-6 pt-6 pointer-events-none"> 
        <div className="pointer-events-auto">
          <CategoryNav categories={categories} activeCategory={activeCategory} onSelect={handleCategoryClick} />
        </div>
      </div>

      {/* --- MENU GRID --- */}
      <div className="p-4 space-y-8 mt-4">
        {menuItems.length === 0 && (
           <div className="text-center py-20 opacity-50">
             <AlertCircle className="w-12 h-12 mx-auto mb-2" />
             <p className="font-bold">No items found</p>
           </div>
        )}

        {categories.filter(c => c !== "All").map((cat) => {
          const categoryItems = menuItems.filter(item => item.category === cat && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
          if (categoryItems.length === 0) return null;

          return (
            <div key={cat} id={cat} className="scroll-mt-40">
              <h3 className="text-lg font-black text-slate-900 mb-4 pl-2 border-l-4 border-emerald-500 leading-none py-1">{cat}</h3>
              <div className="grid grid-cols-1 gap-4">
                {categoryItems.map((item) => (
                  <MenuItemCard 
                    key={item.id}
                    item={item}
                    quantity={getItemQuantity(item.id)}
                    onAdd={() => addToCart(item, isSugarFreeMode)}
                    onRemove={() => removeFromCart(item.id, isSugarFreeMode)}
                    isSugarFreeMode={isSugarFreeMode}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- CART DRAWER --- */}
      <CartDrawer 
        open={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onAdd={(id, sf) => { const item = menuItems.find(i => i.id === id); if (item) addToCart(item, sf); }}
        onRemove={removeFromCart}
        onUpdateItemInstructions={(key, note) => setCartItems(prev => prev.map(i => i.uniqueKey === key ? { ...i, instructions: note } : i))}
        onPlaceOrder={handlePlaceOrder}
        sugarFreeMode={isSugarFreeMode}
      />
      
      {/* Floating Cart Button */}
      <AnimatePresence>
        {!isCartOpen && cartItems.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-6 left-4 right-4 z-30">
            <button onClick={() => setIsCartOpen(true)} className="w-full bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between border-t border-slate-800 active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {cartItems.reduce((a, b) => a + b.quantity, 0)}
                </span>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-xl font-black leading-none">
                    ₹{cartItems.reduce((s, i) => s + (i.item.price * i.quantity), 0)}
                  </p>
                </div>
              </div>
              <span className="font-bold text-sm flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl">
                View Bag <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;