import { useState, useEffect } from "react";
import { motion } from "framer-motion"; 
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, Phone, ShieldCheck, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminPortal from "@/components/AdminPortal";

const AdminLogin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // --- 1. FETCH DATA (Excludes Archived Orders) ---
  const fetchData = async () => {
    setLoading(true);
    
    // Fetch only active orders to keep the dashboard clean
    const { data: ordersData, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'archived') 
      .order('created_at', { ascending: false });

    // Fetch all menu items for inventory management
    const { data: menuData, error: menuErr } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (ordersData) setOrders(ordersData);
    if (menuData) setMenuItems(menuData);
    
    if (orderErr || menuErr) {
      console.error("Fetch Error:", orderErr || menuErr);
    }
    
    setLoading(false);
  };

  // --- 2. AUTHENTICATION HANDLER ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Your Secure PIN
    if (password === "admin123") { 
      setIsAuthenticated(true);
      fetchData();
      toast({ title: "Access Granted", description: "Welcome back, Aakash." });
    } else {
      toast({ title: "Error", description: "Invalid PIN.", variant: "destructive" });
    }
  };

  // --- 3. LIVE ORDER MANAGEMENT ---
  const handleUpdateStatus = async (id: string, status: string) => {
    // Optimistic UI Update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    await supabase.from('orders').update({ status }).eq('id', id);
  };

  const handleDeleteOrder = async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from('orders').delete().eq('id', id);
  };

  // --- 4. THE "END DAY" ARCHIVING LOGIC ---
  const handleEndDay = async () => {
  const confirm = window.confirm("Archive all orders and reset the live dashboard?");
  if (!confirm) return;

  setLoading(true);
  
  // We use .update() to change all non-archived orders to 'archived'
  const { error } = await supabase
    .from('orders')
    .update({ status: 'archived' })
    .neq('status', 'archived'); 

  if (error) {
    console.error("Supabase Error:", error);
    toast({ 
      title: "Reset Failed", 
      description: "Run the SQL command to allow 'archived' status.", 
      variant: "destructive" 
    });
  } else {
    toast({ title: "Success", description: "Dashboard reset!" });
    await fetchData(); 
  }
  setLoading(false);
};
  // --- 5. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // --- RENDER ---
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl relative"
        >
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-1">Owner Portal</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">System Security</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter PIN"
              className="w-full text-center text-3xl font-black tracking-[0.5em] p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-slate-900 transition-all outline-none"
              autoFocus
            />
            <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              UNLOCK DASHBOARD
            </button>
          </form>

          {/* Developer Credentials Section */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-300 uppercase">Lead Developer</span>
              <span className="text-sm font-bold text-slate-900">Aakash</span>
            </div>
            <a 
              href="tel:+910000000000" 
              className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show Loading Spinner during refresh
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <AdminPortal 
      orders={orders}
      menuItems={menuItems}
      onUpdateStatus={handleUpdateStatus}
      onDelete={handleDeleteOrder}
      onUpdateMenu={fetchData}
      onBack={() => setIsAuthenticated(false)}
      onResetSystem={handleEndDay} 
    />
  );
};

export default AdminLogin;