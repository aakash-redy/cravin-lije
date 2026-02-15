import { useState, useMemo } from "react";
import { 
  ArrowLeft, CheckCircle2, Clock, Trash2, RefreshCw, 
  ChefHat, Coffee, X, Search, 
  Utensils, BarChart3, TrendingUp, AlertTriangle,
  Plus, Leaf, Power
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch"; 

interface AdminPortalProps {
  orders: any[];
  menuItems: any[];
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onUpdateMenu: () => void;
  onBack: () => void;
  onResetSystem: () => void;
}

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    sent: "bg-slate-100 text-slate-600 border-slate-200",
    preparing: "bg-amber-100 text-amber-700 border-amber-200",
    ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
    delivered: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", styles[status as keyof typeof styles] || styles.sent)}>
      {status}
    </span>
  );
};

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button 
    onClick={onChange}
    className={cn(
      "w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
      checked ? "bg-emerald-500" : "bg-slate-200"
    )}
  >
    <div className={cn(
      "w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200",
      checked ? "translate-x-4" : "translate-x-0"
    )} />
  </button>
);

// --- Main Component ---

const AdminPortal = ({ 
  orders, 
  menuItems, 
  onUpdateStatus, 
  onDelete, 
  onUpdateMenu, 
  onBack, 
  onResetSystem 
}: AdminPortalProps) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  
  // Search States
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'sent' | 'preparing' | 'ready'>('all');
  
  // Modals State
  const [showEndDayReport, setShowEndDayReport] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // --- MENU MANAGER STATE ---
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "Chai", 
    is_sugar_free_available: true 
  });

  // --- Logic: Menu Management ---
  
  // 1. Add New Item
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      toast({ title: "Missing Info", description: "Name and Price are required!", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('menu_items')
      .insert([{
        name: newItem.name,
        price: parseInt(newItem.price),
        category: newItem.category,
        is_sugar_free_available: newItem.is_sugar_free_available,
        available: true
      }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Item Added", description: `${newItem.name} is live!` });
      setNewItem({ name: "", price: "", category: "Chai", is_sugar_free_available: true });
      setIsAddingItem(false);
      onUpdateMenu();
    }
  };

  // 2. Toggle Stock Availability
  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Could not update menu", variant: "destructive" });
    } else {
      onUpdateMenu(); 
    }
  };

  // 3. Toggle Sugar Free Capability
  const toggleSugarCapability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_sugar_free_available: !currentStatus })
      .eq('id', id);

    if (!error) {
      onUpdateMenu();
      toast({ title: "Updated", description: `Sugar Free option ${!currentStatus ? 'ENABLED' : 'DISABLED'}` });
    }
  };

  // 4. Delete Item
  const deleteMenuItem = async (id: string) => {
    if (!confirm("Permanently remove this item from the menu?")) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) onUpdateMenu();
  };

  // --- Logic: Cancel Safety Net ---
  const confirmCancelOrder = () => {
    if (orderToCancel) {
      onDelete(orderToCancel);
      setOrderToCancel(null);
      toast({ title: "Order Cancelled", description: "The order has been removed." });
    }
  };

  // --- Logic: Stats & Filtering ---
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesFilter = filter === 'all' ? true : o.status === filter;
      const matchesSearch = o.customer_name.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
                            o.id.includes(orderSearchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, orderSearchQuery]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(menuSearchQuery.toLowerCase())
    );
  }, [menuItems, menuSearchQuery]);

  // Generate End Day Data
  const endDayStats = useMemo(() => {
    const itemCounts: Record<string, number> = {};
    let totalItemsSold = 0;

    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity;
        totalItemsSold += item.quantity;
      });
    });

    const sortedItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalItemsSold,
      topItem: sortedItems[0] || { name: "N/A", count: 0 },
      itemBreakdown: sortedItems
    };
  }, [orders, totalRevenue]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Top Bar */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-40 shadow-xl shadow-slate-900/10 rounded-b-[2rem]">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <Power className="w-6 h-6 text-slate-400 hover:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Admin Portal</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Chai Lije System
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase">Today's Sales</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tight">₹{totalRevenue}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-sm">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2", 
                activeTab === 'orders' ? "bg-white text-slate-900 shadow-lg scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <ChefHat className="w-4 h-4" /> 
              Orders 
              {orders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full ml-1">{orders.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('menu')} 
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2", 
                activeTab === 'menu' ? "bg-white text-slate-900 shadow-lg scale-[1.02]" : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <Coffee className="w-4 h-4" /> Menu Manager
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        
        {/* ==================== TAB 1: ORDERS ==================== */}
        {activeTab === 'orders' ? (
          <>
            {/* Search & Filter Bar */}
            <div className="space-y-4 sticky top-[180px] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search customer..." 
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {['all', 'sent', 'preparing', 'ready'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap shadow-sm",
                      filter === f ? "bg-slate-900 text-white border-slate-900 scale-105" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4 pb-24">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
                  <p className="text-slate-400 font-medium">Kitchen is quiet...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredOrders.map((order) => (
                    <motion.div 
                      layout
                      key={order.id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden group"
                    >
                      {/* Status Color Strip */}
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", 
                        order.status === 'ready' ? "bg-emerald-500" : 
                        order.status === 'preparing' ? "bg-amber-400" : "bg-slate-200"
                      )} />

                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-black text-slate-900">{order.customer_name}</h3>
                              <StatusBadge status={order.status} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              <span className="text-slate-300">•</span>
                              ID: {order.id.slice(0, 4)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-slate-900">₹{order.total_amount}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                          {order.order_items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start text-sm group/item">
                              <div className="flex gap-3">
                                <span className="font-black text-slate-400 bg-white w-6 h-6 rounded flex items-center justify-center text-xs shadow-sm border border-slate-100">
                                  {item.quantity}
                                </span>
                                <div>
                                  <span className="font-bold text-slate-700">{item.item_name}</span>
                                  {/* Item-Specific Badges */}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.is_sugar_free && (
                                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                        <Leaf className="w-2.5 h-2.5" /> Sugar Free
                                      </span>
                                    )}
                                    {item.instructions && (
                                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                        <Utensils className="w-2.5 h-2.5" /> {item.instructions}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="font-bold text-slate-400">₹{item.price_at_time_of_order * item.quantity}</span>
                            </div>
                          ))}
                          
                          {/* Global Cooking Note (Legacy support) */}
                          {order.cooking_note && (
                             <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Kitchen Note</p>
                                <p className="text-xs font-bold text-slate-700 italic">"{order.cooking_note}"</p>
                             </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          {order.status === 'sent' && (
                            <button 
                              onClick={() => onUpdateStatus(order.id, 'preparing')}
                              className="col-span-2 bg-amber-400 hover:bg-amber-500 text-amber-950 py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-[0.98]"
                            >
                              <ChefHat className="w-5 h-5" /> START COOKING
                            </button>
                          )}
                          
                          {order.status === 'preparing' && (
                            <button 
                              onClick={() => onUpdateStatus(order.id, 'ready')}
                              className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                              <CheckCircle2 className="w-5 h-5" /> MARK READY
                            </button>
                          )}

                          {order.status === 'ready' && (
                            <button 
                              onClick={() => onUpdateStatus(order.id, 'delivered')}
                              className="col-span-2 bg-slate-900 text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                            >
                              COMPLETE ORDER
                            </button>
                          )}

                          {/* CANCEL BUTTON */}
                          <button 
                            onClick={() => setOrderToCancel(order.id)}
                            className="col-span-2 mt-1 text-[10px] font-bold text-slate-300 hover:text-red-400 flex items-center justify-center gap-1 py-2 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Cancel Order
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* End Day Floating Button */}
            <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
              <button 
                onClick={() => setShowEndDayReport(true)}
                className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl px-6 py-3 rounded-full flex items-center gap-3 text-slate-600 font-bold hover:scale-105 transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                  <BarChart3 className="w-4 h-4" />
                </div>
                End Day Report
              </button>
            </div>
          </>
        ) : (
          /* ==================== TAB 2: MENU MANAGER ==================== */
          <div className="space-y-6 pb-20">
            
            {/* MENU SEARCH BAR (Added!) */}
            <div className="sticky top-[180px] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search item name or category..." 
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>

            {/* ADD ITEM BUTTON */}
            <button 
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" /> {isAddingItem ? "Close Form" : "Add New Item"}
            </button>

            {/* ADD ITEM FORM */}
            <AnimatePresence>
              {isAddingItem && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl space-y-4 mb-4">
                    <h3 className="text-lg font-black text-slate-900">New Item Details</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-1">Item Name</label>
                      <input 
                        value={newItem.name} 
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        placeholder="e.g. Masala Chai" 
                        className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="space-y-2 flex-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Price (₹)</label>
                        <input 
                          type="number" 
                          value={newItem.price} 
                          onChange={e => setNewItem({...newItem, price: e.target.value})}
                          placeholder="20" 
                          className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Category</label>
                        <select 
                          value={newItem.category}
                          onChange={e => setNewItem({...newItem, category: e.target.value})}
                          className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                        >
                          <option>Chai</option>
                          <option>Coffee</option>
                          <option>Snacks</option>
                          <option>Coolers</option>
                          <option>Specials</option>
                        </select>
                      </div>
                    </div>

                    {/* SUGAR FREE CAPABILITY TOGGLE */}
                    <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                           <Leaf className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-800 uppercase">Sugar Free?</p>
                          <p className="text-[10px] font-bold text-emerald-600">Can be made without sugar</p>
                        </div>
                      </div>
                      <Switch 
                         checked={newItem.is_sugar_free_available} 
                         onCheckedChange={(checked) => setNewItem({...newItem, is_sugar_free_available: checked})}
                         className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    <button onClick={handleAddItem} className="w-full py-4 bg-emerald-500 text-white font-black rounded-xl shadow-md active:scale-95 transition-transform hover:bg-emerald-600">
                      SAVE ITEM
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* EXISTING MENU LIST */}
            <div className="space-y-3">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                   <p className="font-bold text-slate-400">No items match your search</p>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className={cn(
                      "bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-colors group",
                      item.available ? "border-slate-100" : "border-slate-100 bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-colors",
                        item.available ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className={cn("font-bold text-lg leading-tight", !item.available && "text-slate-400 line-through")}>{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-400">₹{item.price}</span>
                          <span className="text-[10px] font-bold text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase">{item.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      
                      {/* Capability Toggle (Mini) */}
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => toggleSugarCapability(item.id, item.is_sugar_free_available)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            item.is_sugar_free_available ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300 opacity-50"
                          )}
                          title="Toggle Sugar Free Capability"
                        >
                          <Leaf className="w-4 h-4" />
                        </button>
                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-wide">SF Opt</span>
                      </div>

                      <div className="w-px h-8 bg-slate-100 mx-1" />

                      {/* Stock Toggle */}
                      <div className="flex flex-col items-center gap-1">
                        <ToggleSwitch 
                          checked={item.available} 
                          onChange={() => toggleAvailability(item.id, item.available)}
                        />
                        <span className={cn("text-[7px] font-black uppercase tracking-wide", item.available ? "text-emerald-600" : "text-slate-400")}>
                          {item.available ? "Stock" : "Out"}
                        </span>
                      </div>

                      {/* Delete */}
                      <button 
                        onClick={() => deleteMenuItem(item.id)}
                        className="ml-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- END DAY REPORT MODAL --- */}
      <AnimatePresence>
        {showEndDayReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowEndDayReport(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <button onClick={() => setShowEndDayReport(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-black mb-1">Daily Summary</h2>
                <p className="text-slate-400 text-sm font-medium">{new Date().toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/5">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Sales</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">₹{endDayStats.totalRevenue}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/5">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Orders</p>
                    <p className="text-2xl font-black text-white mt-1">{endDayStats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" /> Best Seller
                  </h3>
                  <div className="bg-amber-50 p-4 rounded-2xl flex items-center justify-between border border-amber-100">
                    <span className="font-bold text-amber-900">{endDayStats.topItem.name}</span>
                    <span className="font-black text-amber-600 bg-white px-3 py-1 rounded-lg shadow-sm border border-amber-100">
                      {endDayStats.topItem.count} Sold
                    </span>
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {endDayStats.itemBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <span className="font-medium text-slate-600">{item.name}</span>
                      <span className="font-bold text-slate-900">{item.count}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    if(confirm("Archive all orders for today?")) {
                      onResetSystem();
                      setShowEndDayReport(false);
                    }
                  }}
                  className="w-full mt-8 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> CLOSE DAY & RESET
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SAFETY NET MODAL (CANCEL ORDER) --- */}
      <AnimatePresence>
        {orderToCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setOrderToCancel(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 shadow-inner">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">Cancel this Order?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 px-4">
                This action cannot be undone. The order will be removed permanently from the active list.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setOrderToCancel(null)}
                  className="py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Keep Order
                </button>
                <button 
                  onClick={confirmCancelOrder}
                  className="py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:scale-[1.02] transition-all"
                >
                  Yes, Cancel It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPortal;