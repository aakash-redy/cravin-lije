import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { supabase } from "@/lib/supabase";
import { Lock, Loader2, Phone, ShieldCheck, LogOut, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom"; // Import for the back button
import AdminPortal from "@/components/AdminPortal";

// Get PIN from environment variables (Safety Check)
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN;

const AdminLogin = () => {
  const navigate = useNavigate(); // Hook for navigation
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
    if (!isAuthenticated) return; // Don't fetch if locked
    
    setLoading(true);
    
    // Fetch Active Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'archived') 
      .order('created_at', { ascending: false });

    // Fetch Menu
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
    
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback

    if (!ADMIN_PIN) {
      toast({ title: "System Error", description: "Admin PIN not configured in .env file", variant: "destructive" });
      return;
    }

    if (password === ADMIN_PIN) { 
      setIsAuthenticated(true);
      setError(false);
      toast({ title: "Access Granted", description: "Welcome back, Boss." });
    } else {
      setError(true);
      setPassword(""); // Clear input on fail
      toast({ title: "Access Denied", variant: "destructive" });
    }
  };

  // --- 3. LIVE ORDER MANAGEMENT ---
  const handleUpdateStatus = async (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); // Optimistic
    await supabase.from('orders').update({ status }).eq('id', id);
  };

  const handleDeleteOrder = async (id: string) => {
    if(!confirm("Cancel this order?")) return;
    setOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from('orders').delete().eq('id', id);
  };

  // --- 4. END DAY LOGIC ---
  const handleEndDay = async () => {
    const confirm = window.confirm("Archive all orders and reset the live dashboard?");
    if (!confirm) return;

    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: 'archived' })
      .neq('status', 'archived'); 

    if (error) {
      toast({ title: "Reset Failed", description: "Check database permissions.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "System Reset Complete." });
      await fetchData(); 
    }
    setLoading(false);
  };

  // --- 5. REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchData(); // Initial load

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // --- RENDER: LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-inner ring-4 ring-slate-900">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-white text-center mb-2">Restricted Access</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center mb-8">Owner Authorization Required</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                value={password}
                onChange={(e) => { setError(false); setPassword(e.target.value); }}
                placeholder="• • • •"
                className={`w-full text-center text-3xl font-black tracking-[0.5em] p-4 bg-slate-950 rounded-2xl border-2 ${error ? 'border-red-500 text-red-500' : 'border-slate-800 focus:border-emerald-500 text-white'} transition-all outline-none placeholder:text-slate-700 placeholder:tracking-normal`}
                autoFocus
              />
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-0 right-0 text-center flex items-center justify-center gap-1 text-red-400 text-xs font-bold"
                >
                  <AlertCircle className="w-3 h-3" /> Incorrect PIN
                </motion.div>
              )}
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all mt-4">
              UNLOCK DASHBOARD
            </button>
          </form>

          {/* PANIC BUTTON (GO BACK) */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 text-slate-500 font-bold text-sm hover:text-white transition-colors py-2 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Go back to Menu
            </button>
          </div>

          {/* Credits */}
          <div className="mt-4 text-center">
             <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
               System by Aakash
             </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDER: LOADING ---
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <AdminPortal 
      orders={orders}
      menuItems={menuItems}
      onUpdateStatus={handleUpdateStatus}
      onDelete={handleDeleteOrder}
      onUpdateMenu={fetchData} // Pass the fetch function so Portal can trigger refreshes
      onBack={() => setIsAuthenticated(false)}
      onResetSystem={handleEndDay} 
    />
  );
};

export default AdminLogin;