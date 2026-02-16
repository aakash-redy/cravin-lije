import { useState, useMemo, useEffect } from "react";
import { 
  Clock, Trash2, RefreshCw, ChefHat, Coffee, X, Search, 
  BarChart3, TrendingUp, AlertTriangle, Plus, Leaf, Power, 
  Star, Sparkles, MessageSquare, User, Pencil, Check, Lock, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase"; 

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

interface AdminPortalProps {
  onBack: () => void;
  onUpdateMenu?: () => void;
}

const PASSCODE = import.meta.env.VITE_ADMIN_PIN || "1234"; 
const CATEGORIES = ["Daily Specials", "Chai", "Coffee", "Milks", "Immunity Boosters", "Snacks", "Cakes", "Coolers", "Mojitos", "Milkshakes"];

// --- HELPER COMPONENTS ---

const cx = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

// RESTORED: StatusBadge Component
const StatusBadge = ({ status }: { status: Order['status'] | string }) => {
  const styles: Record<string, string> = {
    sent: "bg-slate-100 text-slate-600 border-slate-200",
    preparing: "bg-amber-100 text-amber-700 border-amber-200",
    ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
    delivered: "bg-blue-100 text-blue-700 border-blue-200",
    archived: "bg-slate-200 text-slate-400 border-slate-300"
  };
  
  return (
    <span className={cx(
      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", 
      styles[status] || styles.sent
    )}>
      {status}
    </span>
  );
};

// --- MAIN COMPONENT ---
const AdminPortal = ({ onBack }: AdminPortalProps) => {
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("cravin_admin_session") === "active");
  const [inputPasscode, setInputPasscode] = useState("");
  const [authError, setAuthError] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>('all');
  const [showEndDayReport, setShowEndDayReport] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // --- DATA ENGINE ---
  const fetchData = async () => {
    if (!isAuthenticated) return;
    const { data: oData } = await supabase.from('orders').select('*').neq('status', 'archived').order('created_at', { ascending: false });
    if (oData) setOrders(oData as Order[]);
    const { data: mData } = await supabase.from('menu_items').select('*').order('name');
    if (mData) setLocalMenuItems(mData as MenuItem[]);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('admin-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
          new Audio('/ting.mp3').play().catch(() => {});
          setOrders(prev => [payload.new as Order, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // --- ACTIONS ---
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputPasscode === PASSCODE) {
      localStorage.setItem("cravin_admin_session", "active");
      setIsAuthenticated(true);
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 500);
      setInputPasscode("");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    const idToCancel = orderToCancel;
    setOrders(prev => prev.filter(o => o.id !== idToCancel));
    setOrderToCancel(null);
    // Soft archive for customer tracking safety
    await supabase.from('orders').update({ status: 'archived' }).eq('id', idToCancel);
  };

  const handleEndDay = async () => {
    if (!window.confirm("Archive all current orders?")) return;
    const ids = orders.map(o => o.id);
    if (ids.length > 0) await supabase.from('orders').update({ status: 'archived' }).in('id', ids);
    setOrders([]);
    setShowEndDayReport(false);
  };

  const toggleStock = async (id: string, current: boolean) => {
    setLocalMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: !current } : i));
    await supabase.from('menu_items').update({ available: !current }).eq('id', id);
  };

  // --- CALCULATIONS ---
  const filteredOrders = useMemo(() => orders.filter(o => (filter === 'all' || o.status === filter) && (o.customer_name || "").toLowerCase().includes(orderSearchQuery.toLowerCase())), [orders, filter, orderSearchQuery]);
  
  const processedMenuItems = useMemo(() => {
    let items = localMenuItems.filter(i => i.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || i.category.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return items.sort((a, b) => {
      if (a.category === 'Daily Specials' && b.category !== 'Daily Specials') return -1;
      if (a.category !== 'Daily Specials' && b.category === 'Daily Specials') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [localMenuItems, menuSearchQuery]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const endDayStats = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => o.order_items?.forEach(i => { counts[i.item_name] = (counts[i.item_name] || 0) + i.quantity; }));
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));
    return { top: sorted[0] || { name: "N/A", count: 0 }, list: sorted };
  }, [orders]);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-sm text-center">
        <Lock className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-6 tracking-tight">Owner Access</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={inputPasscode} onChange={e => setInputPasscode(e.target.value)} className={cx("w-full bg-slate-900 border-2 rounded-2xl py-4 text-center text-xl font-bold tracking-widest outline-none transition-all", authError ? "border-red-500 animate-shake" : "border-slate-800 focus:border-emerald-500")} placeholder="PASSWORD" autoFocus />
          <button className="w-full bg-emerald-500 text-slate-950 font-black py-4 rounded-2xl active:scale-95 transition-transform">UNLOCK SYSTEM</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-40 rounded-b-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { localStorage.removeItem("cravin_admin_session"); setIsAuthenticated(false); onBack(); }} className="p-2 bg-slate-800 rounded-full hover:bg-red-500/20 transition-colors"><Power className="w-5 h-5 text-red-400" /></button>
            <h1 className="text-xl font-black tracking-tight">Cravin Portal</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue Today</p>
            <p className="text-2xl font-black text-emerald-400">₹{totalRevenue}</p>
          </div>
        </div>
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl backdrop-blur-sm">
          <button onClick={() => setActiveTab('orders')} className={cx("flex-1 py-2.5 rounded-xl font-bold text-sm transition-all", activeTab === 'orders' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400")}>Orders ({orders.length})</button>
          <button onClick={() => setActiveTab('menu')} className={cx("flex-1 py-2.5 rounded-xl font-bold text-sm transition-all", activeTab === 'menu' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400")}>Menu Manager</button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {activeTab === 'orders' ? (
          filteredOrders.length === 0 ? (
            <div className="text-center py-20 opacity-40 font-bold uppercase tracking-widest text-xs">No Active Orders</div>
          ) : (
            filteredOrders.map(order => (
              <motion.div layout key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{order.customer_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={order.status} />
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-900">₹{order.total_amount}</p>
                </div>
                <div className="bg-slate-50/80 p-4 rounded-2xl mb-4 space-y-2 border border-slate-100">
                  {order.order_items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm font-bold text-slate-600">
                      <span>{item.quantity}x {item.item_name} {item.is_sugar_free && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded ml-1">SF</span>}</span>
                      <span className="text-slate-400">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {order.status === 'sent' && <button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="col-span-2 bg-amber-400 text-amber-950 py-3.5 rounded-xl font-black active:scale-95 transition-transform">START PREPARING</button>}
                  {order.status === 'preparing' && <button onClick={() => handleUpdateStatus(order.id, 'ready')} className="col-span-2 bg-emerald-500 text-white py-3.5 rounded-xl font-black active:scale-95 transition-transform">MARK AS READY</button>}
                  {order.status === 'ready' && <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="col-span-2 bg-slate-900 text-white py-3.5 rounded-xl font-black active:scale-95 transition-transform">ORDER DELIVERED</button>}
                  <button onClick={() => setOrderToCancel(order.id)} className="col-span-2 text-[10px] font-bold text-slate-300 py-2 mt-2 hover:text-red-500 transition-colors uppercase tracking-widest"><Trash2 className="w-3 h-3 inline mr-1" /> Cancel Order</button>
                </div>
              </motion.div>
            ))
          )
        ) : (
          processedMenuItems.map(item => (
            <motion.div layout key={item.id} className={cx("bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-all", !item.available ? "bg-slate-50/50 grayscale-sm border-slate-100" : "border-slate-100")}>
              <div className="flex items-center gap-4">
                <div className={cx("w-10 h-10 rounded-xl flex items-center justify-center font-black", item.category === 'Daily Specials' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600')}>
                  {item.category === 'Daily Specials' ? <Sparkles className="w-5 h-5" /> : item.name[0]}
                </div>
                <div>
                  <h4 className={cx("font-bold text-slate-800", !item.available && "text-slate-400 line-through")}>{item.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">₹{item.price} • {item.category}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => toggleStock(item.id, item.available)} className={cx("w-10 h-6 rounded-full p-1 transition-colors duration-200", item.available ? "bg-emerald-500" : "bg-slate-200")}>
                  <div className={cx("w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200", item.available ? "translate-x-4" : "translate-x-0")} />
                </button>
                <span className="text-[7px] font-black mt-1 uppercase text-slate-400">{item.available ? "In Stock" : "Out"}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-30">
        <button onClick={() => setShowEndDayReport(true)} className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl px-8 py-4 rounded-full flex items-center gap-3 font-black active:scale-95 transition-all text-slate-900"><BarChart3 className="w-5 h-5" /> END DAY SUMMARY</button>
      </div>

      <AnimatePresence>
        {showEndDayReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowEndDayReport(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl">
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-black tracking-tight">Sales Report</h2>
                  <button onClick={() => setShowEndDayReport(false)} className="p-2 bg-white/10 rounded-full"><X className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/10 p-5 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p><p className="text-2xl font-black text-emerald-400 mt-1">₹{totalRevenue}</p></div>
                  <div className="bg-white/10 p-5 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Count</p><p className="text-2xl font-black mt-1">{orders.length}</p></div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Bestseller</h3>
                <div className="bg-amber-50/50 p-4 rounded-2xl flex justify-between border border-amber-100 mb-6">
                  <span className="font-bold text-slate-800">{endDayStats.top.name}</span>
                  <span className="font-black text-amber-600">{endDayStats.top.count} Sold</span>
                </div>
                <div className="max-h-40 overflow-y-auto mb-8 space-y-2 pr-2 custom-scrollbar">
                  {endDayStats.list.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm font-bold text-slate-500 border-b border-slate-50 pb-2"><span>{item.name}</span><span>{item.count}</span></div>
                  ))}
                </div>
                <button onClick={handleEndDay} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"><RefreshCw className="w-4 h-4" /> RESET & ARCHIVE DAY</button>
              </div>
            </motion.div>
          </div>
        )}

        {orderToCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOrderToCancel(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs p-8 rounded-[2.5rem] text-center relative z-10 shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Cancel Order?</h3>
              <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">The customer will still see their history, but it will disappear from your live queue.</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setOrderToCancel(null)} className="py-3 font-bold bg-slate-100 text-slate-600 rounded-xl">Keep</button>
                <button onClick={handleCancelOrder} className="py-3 font-black bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/30">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPortal;