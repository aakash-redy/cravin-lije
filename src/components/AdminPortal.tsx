import { useState, useMemo, useEffect } from "react";
import { 
  Clock, Trash2, RefreshCw, ChefHat, Coffee, X, Search, 
  BarChart3, TrendingUp, AlertTriangle, Plus, Leaf, Power, 
  Star, Sparkles, MessageSquare, User, Pencil, Check, Lock, ChevronRight, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORTANT: Points to src/lib/supabase.ts ---
import { supabase } from "../lib/supabase"; 

// --- SECURITY HELPER (Internal Hashing) ---
async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- TYPESCRIPT INTERFACES ---
interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
  price_at_time_of_order?: number;
  is_sugar_free?: boolean;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  table_number?: string;
  status: 'sent' | 'preparing' | 'ready' | 'delivered' | 'archived';
  total_amount: number;
  order_items: OrderItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  is_sugar_free_available: boolean;
}

interface Review {
  id: string;
  created_at: string;
  customer_name: string;
  rating: number;
  comment: string;
}

interface AdminPortalProps {
  onUpdateMenu?: () => void;
  onBack: () => void;
}

// --- CONFIGURATION ---
const PASSCODE = import.meta.env.VITE_ADMIN_PIN || "1234"; 

const CATEGORIES = [
  "Daily Specials", "Chai", "Coffee", "Milks", 
  "Immunity Boosters", "Snacks", "Cakes", 
  "Coolers", "Mojitos", "Milkshakes"   
];

const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) => (
  <button 
    type="button"
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={cx("w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none", checked ? "bg-emerald-500" : "bg-slate-200")}
  >
    <div className={cx("w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200", checked ? "translate-x-4" : "translate-x-0")} />
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    sent: "bg-slate-100 text-slate-600 border-slate-200",
    preparing: "bg-amber-100 text-amber-700 border-amber-200",
    ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
    delivered: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return <span className={cx("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", styles[status] || styles.sent)}>{status}</span>;
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={cx("w-3 h-3", star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} />)}
  </div>
);

// --- MAIN COMPONENT ---

const AdminPortal = ({ onUpdateMenu, onBack }: AdminPortalProps) => {
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("cravin_admin_session") === "active");
  const [inputPasscode, setInputPasscode] = useState("");
  const [authError, setAuthError] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'reviews' | 'settings'>('orders');
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]); 
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>('all');
  const [showEndDayReport, setShowEndDayReport] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Chai", is_sugar_free_available: true });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  
  // Settings State
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 1. Check Hardcoded Fallback First
    if (inputPasscode === PASSCODE) {
      localStorage.setItem("cravin_admin_session", "active");
      setIsAuthenticated(true);
      return;
    }

    // 2. Check Secure Database Password
    try {
      const hash = await hashPassword(inputPasscode);
      const { data } = await supabase.from('restaurants').select('admin_password').single();
      
      if (data && data.admin_password === hash) {
        localStorage.setItem("cravin_admin_session", "active");
        setIsAuthenticated(true);
      } else {
        throw new Error("Invalid");
      }
    } catch (err) {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
      setInputPasscode("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cravin_admin_session");
    setIsAuthenticated(false);
    onBack();
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return alert("Please enter a password");
    setPassLoading(true);
    try {
      const secureHash = await hashPassword(newPassword);
      const { error } = await supabase.from('restaurants').update({ admin_password: secureHash }).eq('id', 1);
      
      if (error) throw error;
      alert("Password updated securely! Please login again.");
      handleLogout();
    } catch (err) {
      alert("Error updating password. Check console.");
      console.error(err);
    } finally {
      setPassLoading(false);
    }
  };

  // --- 1. DATA ENGINE (Orders & Menu) ---
  const fetchData = async () => {
    if (!isAuthenticated) return;
    
    const { data: ordersData } = await supabase.from('orders').select('*').neq('status', 'archived').order('created_at', { ascending: false });
    if (ordersData) setOrders(ordersData as Order[]);

    const { data: menuData } = await supabase.from('menu_items').select('*').order('name');
    if (menuData) setLocalMenuItems(menuData as MenuItem[]);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('realtime-admin-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: any) => {
          new Audio('/ting.mp3').play().catch(() => {});
          setOrders((prev) => [payload.new as Order, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'reviews' && isAuthenticated) fetchReviews();
  }, [activeTab, isAuthenticated]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    if (data) setReviews(data as Review[]);
    setLoadingReviews(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const handleDeleteOrder = async (id: string | null) => {
    if (!id) return;
    setOrders(prev => prev.filter(o => o.id !== id));
    setOrderToCancel(null);
    await supabase.from('orders').delete().eq('id', id);
  };

  const handleEndDay = async () => {
    if (!window.confirm("Archive all orders?")) return;
    const orderIds = orders.map(o => o.id);
    if (orderIds.length === 0) { setShowEndDayReport(false); return; }
    await supabase.from('orders').update({ status: 'archived' }).in('id', orderIds);
    setOrders([]); setShowEndDayReport(false);
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return alert("Enter Name & Price");
    const itemPayload = { name: newItem.name, price: parseInt(newItem.price), category: newItem.category, is_sugar_free_available: newItem.is_sugar_free_available, available: true };
    const { error } = await supabase.from('menu_items').insert([itemPayload]);
    if (!error) { setIsAddingItem(false); setNewItem({ name: "", price: "", category: "Chai", is_sugar_free_available: true }); fetchData(); }
  };

  const startEditingPrice = (item: MenuItem) => {
    setEditingPriceId(item.id);
    setEditPriceValue(item.price.toString());
  };

  const saveNewPrice = async (id: string) => {
    if (!editPriceValue) return;
    const newPrice = parseInt(editPriceValue);
    setLocalMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
    setEditingPriceId(null);
    await supabase.from('menu_items').update({ price: newPrice }).eq('id', id);
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    setLocalMenuItems(prev => prev.map(item => item.id === id ? { ...item, available: !current } : item));
    await supabase.from('menu_items').update({ available: !current }).eq('id', id);
  };

  const toggleSugarCapability = async (id: string, current: boolean) => {
    setLocalMenuItems(prev => prev.map(item => item.id === id ? { ...item, is_sugar_free_available: !current } : item));
    await supabase.from('menu_items').update({ is_sugar_free_available: !current }).eq('id', id);
  };

  const deleteMenuItem = async (id: string) => {
    if (!window.confirm("Delete this item?")) return;
    setLocalMenuItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('menu_items').delete().eq('id', id);
  };

  const filteredOrders = useMemo(() => orders.filter(o => (filter === 'all' || o.status === filter) && (o.customer_name || "").toLowerCase().includes(orderSearchQuery.toLowerCase())), [orders, filter, orderSearchQuery]);
  const processedMenuItems = useMemo(() => {
    let items = localMenuItems.filter((item) => item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || item.category.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return items.sort((a, b) => {
      if (a.category === 'Daily Specials' && b.category !== 'Daily Specials') return -1;
      if (a.category !== 'Daily Specials' && b.category === 'Daily Specials') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [localMenuItems, menuSearchQuery]);

  const averageRating = useMemo(() => reviews.length === 0 ? 0 : (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1), [reviews]);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const endDayStats = useMemo(() => {
    const itemCounts: Record<string, number> = {};
    orders.forEach(order => order.order_items?.forEach((item) => { const name = item.item_name || "Unknown"; itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1); }));
    const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));
    return { totalRevenue, totalOrders: orders.length, topItem: sortedItems[0] || { name: "N/A", count: 0 }, itemBreakdown: sortedItems };
  }, [orders, totalRevenue]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-slate-700"><Lock className="w-8 h-8 text-emerald-500" /></div>
            <h1 className="text-2xl font-black tracking-tight">Admin Access</h1>
            <p className="text-slate-400 text-sm font-medium mt-2">Enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={inputPasscode} onChange={(e) => setInputPasscode(e.target.value)} className={cx("w-full bg-slate-900 border-2 rounded-2xl py-4 px-6 text-center text-xl font-bold tracking-widest outline-none transition-all placeholder:text-slate-800", authError ? "border-red-500 animate-pulse text-red-500" : "border-slate-800 focus:border-emerald-500 text-white")} placeholder="Enter Password" autoFocus />
            <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-emerald-400">UNLOCK <ChevronRight className="w-5 h-5" /></button>
          </form>
          <button onClick={onBack} className="w-full mt-6 text-slate-600 text-xs font-bold hover:text-white transition-colors">Return to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-40 shadow-xl rounded-b-[2rem]">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><Power className="w-6 h-6 text-slate-400 hover:text-white" /></button>
              <div><h1 className="text-2xl font-black tracking-tight">Admin Portal</h1><p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live System</p></div>
            </div>
            <div className="text-right"><p className="text-xs text-slate-400 font-bold uppercase">Sales Today</p><p className="text-3xl font-black text-emerald-400">₹{totalRevenue}</p></div>
          </div>
          <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-sm overflow-x-auto">
            <button onClick={() => setActiveTab('orders')} className={cx("flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-fit", activeTab === 'orders' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400")}><ChefHat className="w-4 h-4" /> Orders {orders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{orders.length}</span>}</button>
            <button onClick={() => setActiveTab('menu')} className={cx("flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-fit", activeTab === 'menu' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400")}><Coffee className="w-4 h-4" /> Menu</button>
            <button onClick={() => setActiveTab('reviews')} className={cx("flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-fit", activeTab === 'reviews' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400")}><MessageSquare className="w-4 h-4" /> Reviews</button>
            <button onClick={() => setActiveTab('settings')} className={cx("flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-w-fit", activeTab === 'settings' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400")}><Settings className="w-4 h-4" /> Settings</button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {activeTab === 'orders' ? (
          <>
            <div className="space-y-4 sticky top-[180px] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search customer..." value={orderSearchQuery} onChange={(e) => setOrderSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm font-bold outline-none" /></div>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">{['all', 'sent', 'preparing', 'ready'].map((f) => (<button key={f} onClick={() => setFilter(f)} className={cx("px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap", filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-500")}>{f}</button>))}</div>
            </div>
            <div className="space-y-4 pb-24">
              <AnimatePresence>{filteredOrders.map((order) => (
                    <motion.div layout key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                      <div className={cx("absolute left-0 top-0 bottom-0 w-1.5", order.status === 'ready' ? "bg-emerald-500" : order.status === 'preparing' ? "bg-amber-400" : "bg-slate-200")} />
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-4">
                          <div><div className="flex items-center gap-3"><h3 className="text-xl font-black text-slate-900">{order.customer_name || `Table ${order.table_number}`}</h3><StatusBadge status={order.status} /></div><p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p></div>
                          <p className="text-2xl font-black text-slate-900">₹{order.total_amount}</p>
                        </div>
                        <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl">{order.order_items?.map((item, idx) => (<div key={idx} className="flex justify-between items-start text-sm"><div className="flex gap-3"><span className="font-black text-slate-400 bg-white w-6 h-6 rounded flex items-center justify-center text-xs">{item.quantity}</span><div><span className="font-bold text-slate-700">{item.item_name}</span>{item.is_sugar_free && <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">SF</span>}</div></div><span className="font-bold text-slate-400">₹{(item.price_at_time_of_order || item.price) * item.quantity}</span></div>))}</div>
                        <div className="grid grid-cols-2 gap-3">{order.status === 'sent' && <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="col-span-2 bg-amber-400 text-amber-950 py-3.5 rounded-xl font-black active:scale-95">START COOKING</button>}{order.status === 'preparing' && <button onClick={() => handleUpdateStatus(order.id, 'ready')} className="col-span-2 bg-emerald-500 text-white py-3.5 rounded-xl font-black active:scale-95">MARK READY</button>}{order.status === 'ready' && <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="col-span-2 bg-slate-900 text-white py-3.5 rounded-xl font-black active:scale-95">COMPLETE ORDER</button>}<button onClick={() => setOrderToCancel(order.id)} className="col-span-2 text-[10px] font-bold text-slate-300 py-2 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3 inline mr-1" /> Cancel Order</button></div>
                      </div>
                    </motion.div>
                ))}</AnimatePresence>
            </div>
          </>
        ) : activeTab === 'menu' ? (
          <div className="space-y-6 pb-20">
            <div className="sticky top-[180px] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Search menu..." value={menuSearchQuery} onChange={(e) => setMenuSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm font-bold outline-none" /></div>
            </div>
            <button onClick={() => setIsAddingItem(!isAddingItem)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95"><Plus className="w-5 h-5" /> {isAddingItem ? "Cancel" : "Add New Item"}</button>
            <AnimatePresence>{isAddingItem && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden"><div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-4"><input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Item Name" className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none" /><div className="flex gap-4"><input type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} placeholder="Price" className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none flex-1" /><select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="bg-slate-50 p-3 rounded-xl font-bold outline-none flex-1">{CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}</select></div><div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl"><div><p className="text-xs font-black text-emerald-800 uppercase">Sugar Free?</p></div><ToggleSwitch checked={newItem.is_sugar_free_available} onChange={(c) => setNewItem({...newItem, is_sugar_free_available: c})} /></div><button onClick={handleAddItem} className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl active:scale-95">SAVE ITEM</button></div></motion.div>)}</AnimatePresence>
            <div className="space-y-3">{processedMenuItems.map((item) => (
                  <motion.div layout key={item.id} className={cx("bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-colors relative overflow-hidden", item.available ? "border-slate-100" : "border-slate-100 bg-slate-50/50", item.category === 'Daily Specials' && "border-amber-200 bg-amber-50/30")}>
                    {item.category === 'Daily Specials' && <div className="absolute top-0 left-0 bg-amber-400 text-amber-900 text-[8px] font-black px-2 py-0.5">SPECIAL</div>}
                    <div className="flex items-center gap-4">
                      <div className={cx("w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner", item.available ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400")}>{item.category === 'Daily Specials' ? <Sparkles className="w-6 h-6 text-amber-500" /> : item.name.charAt(0)}</div>
                      <div>
                        <h4 className={cx("font-bold text-lg leading-tight", !item.available && "text-slate-400 line-through")}>{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {editingPriceId === item.id ? (<div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-400">₹</span><input type="number" autoFocus value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="w-16 bg-slate-100 rounded px-1 py-0.5 text-sm font-bold outline-emerald-500" /><button onClick={() => saveNewPrice(item.id)} className="bg-emerald-500 text-white p-1 rounded-full hover:bg-emerald-600"><Check className="w-3 h-3" /></button></div>) : (<><p className="text-xs font-bold text-slate-400 uppercase">₹{item.price} • {item.category}</p><button onClick={() => startEditingPrice(item)} className="text-slate-300 hover:text-indigo-500 transition-colors"><Pencil className="w-3 h-3" /></button></>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1"><button onClick={() => toggleSugarCapability(item.id, item.is_sugar_free_available)} className={cx("w-8 h-8 rounded-lg flex items-center justify-center", item.is_sugar_free_available ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}><Leaf className="w-4 h-4" /></button><span className="text-[7px] font-black text-slate-300">SF Opt</span></div>
                      <div className="flex flex-col items-center gap-1"><ToggleSwitch checked={item.available} onChange={() => toggleAvailability(item.id, item.available)} /><span className="text-[7px] font-black text-slate-300 uppercase">{item.available ? "Stock" : "Out"}</span></div>
                      <button onClick={() => deleteMenuItem(item.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </motion.div>
            ))}</div>
          </div>
        ) : activeTab === 'reviews' ? (
          <div className="space-y-6 pb-20">
            <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <button onClick={fetchReviews} disabled={loadingReviews} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <RefreshCw className={cx("w-4 h-4 text-white", loadingReviews && "animate-spin")} />
              </button>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 tracking-widest">Average Happiness</h3>
              <div className="flex items-end gap-3"><span className="text-5xl font-black text-yellow-400">{averageRating}</span><div className="pb-2"><StarRating rating={Math.round(Number(averageRating))} /><p className="text-xs font-bold text-slate-500 mt-1">{reviews.length} reviews</p></div></div>
            </div>
            <div className="space-y-4">{loadingReviews ? (<div className="text-center py-10 opacity-50 font-bold">Fetching Reviews...</div>) : reviews.length === 0 ? (<div className="text-center py-20 opacity-50"><MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-200" /><p className="font-bold text-slate-400">No reviews yet</p></div>) : (reviews.map((r) => (<motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} key={r.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm"><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div><div><h4 className="font-black text-slate-900">{r.customer_name || "Guest"}</h4><p className="text-[10px] font-bold text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p></div></div><div className="bg-yellow-50 px-3 py-1 rounded-xl flex items-center gap-1 font-black text-yellow-600 text-sm">{r.rating}.0 <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /></div></div><p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">"{r.comment}"</p></motion.div>)))}</div>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center"><Lock className="w-6 h-6 text-slate-400" /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Security</h3>
                  <p className="text-xs font-bold text-slate-400">Manage your access</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">New Admin Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new secure password" className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold outline-emerald-500 text-slate-900 placeholder:text-slate-300" />
                </div>
                <button onClick={handleUpdatePassword} disabled={passLoading} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
                  {passLoading ? "UPDATING..." : "UPDATE PASSWORD"}
                </button>
                <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed">
                  Note: This will encrypt your password using SHA-256 (Bank-Level Security).<br/>Once changed, you must login with the new password.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none"><button onClick={() => setShowEndDayReport(true)} className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl px-6 py-3 rounded-full flex items-center gap-3 font-bold active:scale-95"><BarChart3 className="w-4 h-4 text-slate-900" /> End Day Report</button></div>
      <AnimatePresence>{showEndDayReport && (<div className="fixed inset-0 z-[100] flex items-center justify-center px-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEndDayReport(false)} /><motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"><div className="bg-slate-900 p-8 text-white relative"><button onClick={() => setShowEndDayReport(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"><X className="w-5 h-5" /></button><h2 className="text-2xl font-black mb-1">Daily Summary</h2><div className="mt-8 grid grid-cols-2 gap-4"><div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md"><p className="text-xs font-bold text-slate-400 uppercase">Sales</p><p className="text-2xl font-black text-emerald-400 mt-1">₹{totalRevenue}</p></div><div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md"><p className="text-xs font-bold text-slate-400 uppercase">Orders</p><p className="text-2xl font-black text-white mt-1">{orders.length}</p></div></div></div><div className="p-8"><div className="mb-6"><h3 className="text-sm font-black text-slate-900 uppercase mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Top Seller</h3><div className="bg-amber-50 p-4 rounded-2xl flex justify-between border border-amber-100"><span className="font-bold">{endDayStats.topItem.name}</span><span className="font-black text-amber-600">{endDayStats.topItem.count} Sold</span></div></div><div className="max-h-[150px] overflow-y-auto space-y-2 mb-8">{endDayStats.itemBreakdown.map((item, idx) => (<div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg"><span className="text-slate-600">{item.name}</span><span className="font-bold">{item.count}</span></div>))}</div><button onClick={handleEndDay} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"><RefreshCw className="w-4 h-4" /> CLOSE DAY & RESET</button></div></motion.div></div>)}</AnimatePresence>
      <AnimatePresence>{orderToCancel && (<div className="fixed inset-0 z-[100] flex items-center justify-center px-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOrderToCancel(null)} /><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative z-10 text-center"><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 shadow-inner"><AlertTriangle className="w-8 h-8" /></div><h3 className="text-xl font-black text-slate-900 mb-2">Cancel Order?</h3><p className="text-sm font-medium text-slate-500 mb-8">This action will permanently remove the order from the list.</p><div className="grid grid-cols-2 gap-3 mt-8"><button onClick={() => setOrderToCancel(null)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">Keep</button><button onClick={() => handleDeleteOrder(orderToCancel)} className="py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all">Yes, Cancel</button></div></motion.div></div>)}</AnimatePresence>
    </div>
  );
};

export default AdminPortal;