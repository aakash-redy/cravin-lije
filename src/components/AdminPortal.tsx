import { useState, useMemo } from "react";
import { 
  ArrowLeft, CheckCircle2, Clock, Trash2, RefreshCw, 
  ChefHat, Coffee, X, Search, 
  Utensils, BarChart3, TrendingUp, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      "w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
      checked ? "bg-emerald-500" : "bg-slate-200"
    )}
  >
    <div className={cn(
      "w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200",
      checked ? "translate-x-5" : "translate-x-0"
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
  const [filter, setFilter] = useState<'all' | 'sent' | 'preparing' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals State
  const [showEndDayReport, setShowEndDayReport] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  // --- Logic: Menu Management ---
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

  const deleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
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

  // --- Logic: Stats & Reports ---
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesFilter = filter === 'all' ? true : o.status === filter;
      const matchesSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            o.id.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, searchQuery]);

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
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-40 shadow-xl shadow-slate-900/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Admin Portal</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Live System
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
              <Coffee className="w-4 h-4" /> Menu
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {activeTab === 'orders' ? (
          <>
            {/* Search & Filter Bar */}
            <div className="space-y-4 sticky top-[180px] z-30 bg-slate-50/95 backdrop-blur-sm py-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search customer or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <p className="text-slate-400 font-medium">Try adjusting your filters</p>
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
                      {/* Status Strip */}
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
                                  {item.instructions && (
                                    <div className="flex items-start gap-1 mt-1 text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md inline-block">
                                      <Utensils className="w-3 h-3 mt-0.5" /> {item.instructions}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="font-bold text-slate-400">₹{item.price_at_time_of_order * item.quantity}</span>
                            </div>
                          ))}
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

                          {/* CANCEL BUTTON WITH SAFETY NET */}
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
                className="pointer-events-auto bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl px-6 py-3 rounded-full flex items-center gap-3 text-slate-600 font-bold hover:scale-105 transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                  <BarChart3 className="w-4 h-4" />
                </div>
                End Day & View Report
              </button>
            </div>
          </>
        ) : (
          /* MENU MANAGEMENT TAB */
          <div className="space-y-4 pb-20">
            {menuItems.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                className={cn(
                  "bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-colors",
                  item.available ? "border-slate-100" : "border-slate-100 bg-slate-50/50"
                )}
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner",
                     item.available ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                   )}>
                     {item.name.charAt(0)}
                   </div>
                   <div>
                     <h4 className={cn("font-bold text-lg leading-tight", !item.available && "text-slate-400 line-through")}>{item.name}</h4>
                     <p className="text-sm font-bold text-slate-400 mt-1">₹{item.price}</p>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1">
                    <ToggleSwitch 
                      checked={item.available} 
                      onChange={() => toggleAvailability(item.id, item.available)}
                    />
                    <span className={cn("text-[10px] font-bold uppercase", item.available ? "text-emerald-600" : "text-slate-400")}>
                      {item.available ? "In Stock" : "Sold Out"}
                    </span>
                  </div>
                  
                  <div className="w-px h-8 bg-slate-100 mx-2" />
                  
                  <button 
                    onClick={() => deleteMenuItem(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
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
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Sales</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">₹{endDayStats.totalRevenue}</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
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
                    <span className="font-black text-amber-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                      {endDayStats.topItem.count} Sold
                    </span>
                  </div>
                </div>

                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-3">
                  {endDayStats.itemBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
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
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
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