import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminPortal from "@/components/AdminPortal"; // Ensure you saved the previous code here!

const AdminLogin = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // --- FETCH DATA (Only runs if authenticated) ---
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Get Orders
    const { data: ordersData } = await supabase
      .from('orders')
     // ✅ NEW (Fast JSON Way)
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Get Menu
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (ordersData) setOrders(ordersData);
    if (menuData) setMenuItems(menuData);
    
    setLoading(false);
  };

  // --- HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple PIN protection for now (Change "admin123" to whatever you want)
    if (password === "admin123") {
      setIsAuthenticated(true);
      fetchData();
      toast({ title: "Welcome back!", description: "Access granted to Owner Portal." });
    } else {
      toast({ title: "Access Denied", description: "Wrong password.", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    // Optimistic Update (Update UI instantly)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    
    // Update DB
    await supabase.from('orders').update({ status }).eq('id', id);
  };

  const handleDeleteOrder = async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from('orders').delete().eq('id', id);
  };

  // --- SUBSCRIBE TO LIVE UPDATES ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData(); // Refetch if new order comes in
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  // --- RENDER ---
  
  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white w-full max-w-sm p-8 rounded-[2rem] shadow-2xl">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-2xl font-black text-center text-slate-900 mb-2">Owner Login</h1>
          <p className="text-center text-slate-400 text-sm mb-8">Enter your PIN to manage Cravin.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter PIN"
              className="w-full text-center text-2xl font-black tracking-widest p-4 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-slate-900 focus:outline-none transition-colors"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-transform"
            >
              UNLOCK PORTAL
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. LOADING SCREEN
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    );
  }

  // 3. ACTUAL DASHBOARD (Reusing the enhanced component)
  return (
    <AdminPortal 
      orders={orders}
      menuItems={menuItems}
      onUpdateStatus={handleUpdateStatus}
      onDelete={handleDeleteOrder}
      onUpdateMenu={fetchData}
      onBack={() => setIsAuthenticated(false)}
      onResetSystem={() => {
        // Logic to archive orders could go here
        alert("System Reset Feature Coming Soon!");
      }}
    />
  );
};

export default AdminLogin;