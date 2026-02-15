import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, Phone, LogOut, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AdminPortal from "@/components/AdminPortal";

// Get PIN from environment variables (No hardcoded fallback for security)
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    // Only fetch if the user is authorized to see the data
    if (!isAuthenticated) return; 
    
    setLoading(true);
    
    // Fetch Active Orders (Not Archived)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'archived') 
      .order('created_at', { ascending: false });

    // Fetch Full Menu
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (ordersData) setOrders(ordersData);
    if (menuData) setMenuItems(menuData);
    
    setLoading(false);
  };

  // --- 2. AUTHENTICATION HANDLER ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (navigator.vibrate) navigator.vibrate(50);

    // Block access if ENV is missing
    if (!ADMIN_PIN) {
      toast({ 
        title: "System Configuration Error", 
        description: "Admin PIN missing in environment variables.", 
        variant: "destructive" 
      });
      return;
    }

    if (password === ADMIN_PIN) { 
      setIsAuthenticated(true);
      setError(false);
      toast({ title: "Welcome back, Boss.", description: "Chai Lije Dashboard unlocked." });
    } else {
      setError(true);
      setPassword(""); // Clear input
      toast({ title: "Access Denied", variant: "destructive" });
    }
  };

  // --- 3. DATA MANAGEMENT FUNCTIONS ---

  const handleUpdateStatus = async (id: string, status: string) => {
    // Optimistic UI Update (Immediate visual change)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    await supabase.from('orders').update({ status }).eq('id', id);
  };

  const handleDeleteOrder = async (id: string) => {
    // This function maps to 'onDelete' in your AdminPortal
    setOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from('orders').delete().eq('id', id);
    toast({ title: "Order Removed" });
  };

  const handleEndDay = async () => {
    const confirm = window.confirm("End the day? All active orders will be archived.");
    if (!confirm) return;

    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'archived' })
      .neq('status', 'archived'); 

    if (error) {
      toast({ title: "Reset Failed", description: "Check database rules.", variant: "destructive" });
    } else {
      toast({ title: "Dashboard Reset", description: "All orders archived successfully." });
      await fetchData(); 
    }
    setLoading(false);
  };

  // --- 4. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchData(); // Initial load

    // Listen for Order changes or Menu changes to keep Admin in sync
    const channel = supabase.channel('admin-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        
        {/* Decorative Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 w-full max-w-sm p-8 rounded-[3rem] shadow-2xl relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center shadow-inner ring-1 ring-slate-700">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-1 tracking-tight">Owner Access</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] text-center mb-10">Chai Lije Dashboard</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <motion.input
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                type="password"
                inputMode="numeric"
                value={password}
                onChange={(e) => { setError(false); setPassword(e.target.value); }}
                placeholder="PIN REQUIRED"
                className={`w-full text-center text-2xl font-black tracking-[0.5em] p-5 bg-slate-950/50 rounded-2xl border-2 ${error ? 'border-red-500 text-red-500' : 'border-slate-800 focus:border-emerald-500 text-white'} transition-all outline-none placeholder:text-slate-800 placeholder:tracking-widest placeholder:text-xs`}
                autoFocus
              />
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute -bottom-6 left-0 right-0 text-center flex items-center justify-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest"
                >
                  <AlertCircle className="w-3 h-3" /> Access Denied
                </motion.div>
              )}
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/10 active:scale-95 transition-all mt-4">
              UNLOCK SYSTEM
            </button>
          </form>

          {/* BACK BUTTON */}
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 text-slate-500 font-bold text-xs hover:text-white transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" /> Exit to Customer View
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDER: LOADING STATE ---
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Live Data...</p>
        </div>
      </div>
    );
  }

  // --- RENDER: FULL DASHBOARD ---
  return (
    <AdminPortal 
      orders={orders}
      menuItems={menuItems}
      onUpdateStatus={handleUpdateStatus}
      onDelete={handleDeleteOrder} // Passed to solve the confirmCancel error
      onUpdateMenu={fetchData} 
      onBack={() => setIsAuthenticated(false)}
      onResetSystem={handleEndDay} 
    />
  );
};

export default AdminLogin;