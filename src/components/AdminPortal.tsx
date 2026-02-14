import { useState } from "react";
import { 
  ArrowLeft, CheckCircle2, Clock, Trash2, RefreshCw, 
  ChefHat, Coffee, DollarSign, XCircle, Search 
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

  // Logic to toggle "In Stock" / "Out of Stock"
  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Could not update menu", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Item availability changed" });
      onUpdateMenu(); // Refresh the main app
    }
  };

  // Logic to delete a menu item
  const deleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) onUpdateMenu();
  };

  // Calculate Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-50 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Owner Portal</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cravin' Control Center</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase">Today's Revenue</p>
            <p className="text-3xl font-black text-emerald-400">₹{totalRevenue}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('orders')} 
            className={cn("flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2", activeTab === 'orders' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-white")}
          >
            <ChefHat className="w-4 h-4" /> Live Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('menu')} 
            className={cn("flex-1 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2", activeTab === 'menu' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-white")}
          >
            <Coffee className="w-4 h-4" /> Manage Menu
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        {activeTab === 'orders' ? (
          <>
            {/* Order Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {['all', 'sent', 'preparing', 'ready'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap",
                    filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No active orders</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <motion.div 
                    layout
                    key={order.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-slate-900">{order.customer_name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                            order.status === 'ready' ? "bg-emerald-100 text-emerald-700" :
                            order.status === 'preparing' ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1">Order #{order.id.slice(0, 4)} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <p className="text-xl font-black text-slate-900">₹{order.total_amount}</p>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-2xl">
                      {order.order_items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                          <div>
                            <span className="font-bold text-slate-700">{item.quantity}x {item.item_name}</span>
                            {item.instructions && (
                              <p className="text-xs text-indigo-500 font-bold italic mt-0.5">Note: {item.instructions}</p>
                            )}
                            {item.is_sugar_free && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded ml-2 font-bold">SF</span>
                            )}
                          </div>
                          <span className="font-medium text-slate-400">₹{item.price_at_time_of_order * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      {order.status === 'sent' && (
                        <button 
                          onClick={() => onUpdateStatus(order.id, 'preparing')}
                          className="col-span-2 bg-amber-400 hover:bg-amber-500 text-amber-950 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-colors"
                        >
                          <ChefHat className="w-5 h-5" /> START COOKING
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button 
                          onClick={() => onUpdateStatus(order.id, 'ready')}
                          className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5" /> MARK READY
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button 
                          onClick={() => onUpdateStatus(order.id, 'delivered')}
                          className="col-span-2 bg-slate-900 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2"
                        >
                          COMPLETE ORDER
                        </button>
                      )}

                      <button 
                        onClick={() => onDelete(order.id)}
                        className="col-span-2 mt-2 text-xs font-bold text-red-400 hover:text-red-600 flex items-center justify-center gap-1 py-2"
                      >
                        <Trash2 className="w-3 h-3" /> Cancel Order
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-200">
              <button 
                onClick={onResetSystem}
                className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-400 font-bold rounded-2xl hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> ARCHIVE ALL ORDERS (END DAY)
              </button>
            </div>
          </>
        ) : (
          /* MENU MANAGEMENT TAB */
          <div className="space-y-4">
             {menuItems.map((item) => (
               <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg", item.available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className={cn("font-bold text-lg", !item.available && "text-slate-400 line-through")}>{item.name}</h4>
                      <p className="text-sm font-medium text-slate-400">₹{item.price}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleAvailability(item.id, item.available)}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors",
                        item.available ? "bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700" : "bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"
                      )}
                    >
                      {item.available ? "In Stock" : "Sold Out"}
                    </button>
                    <button 
                      onClick={() => deleteMenuItem(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;