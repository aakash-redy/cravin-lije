import { useState, useMemo } from "react";
import { 
  Trash2, CheckCircle, ChefHat, Coffee, Edit3, Save, 
  LogOut, Search, RefreshCw, X, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/pages/Index"; 

interface AdminPortalProps {
  orders: any[];
  menuItems: any[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
  onUpdateMenu: (updatedItems: any[]) => void;
  onBack: () => void;
  onResetSystem: () => void; // Restored: For End of Day
}

const AdminPortal = ({ 
  orders, menuItems, onUpdateStatus, onDelete, onUpdateMenu, onBack, onResetSystem 
}: AdminPortalProps) => {
  
  // --- View State ---
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const [showEndDayModal, setShowEndDayModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // --- Menu Edit State ---
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // --- Calculations ---
  const daySummary = useMemo(() => ({
    count: orders.length,
    revenue: orders.reduce((sum, o) => sum + o.total, 0)
  }), [orders]);

  const filteredMenu = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Handlers ---
  const handleToggleAvailability = (id: number) => {
    const updated = menuItems.map(item => item.id === id ? { ...item, available: !item.available } : item);
    onUpdateMenu(updated);
  };

  const startEditing = (id: number, currentPrice: number) => {
    setEditingItem(String(id));
    setTempPrice(String(currentPrice));
  };

  const savePrice = (id: number) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const updated = menuItems.map(item => item.id === id ? { ...item, price: newPrice } : item);
      onUpdateMenu(updated);
    }
    setEditingItem(null);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      onDelete(orderToDelete);
      setOrderToDelete(null);
    }
  };

  const handleEndDay = () => {
    onResetSystem();
    setShowEndDayModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans animate-in fade-in duration-300">
      
      {/* --- TOP BAR --- */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center">
          
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200"
          >
            <LogOut className="w-4 h-4 rotate-180" /> Back
          </button>

          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Admin Portal
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </h1>
        </div>

        {/* --- TABS --- */}
        <div className="px-6 flex gap-4 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex-1 py-3 text-sm font-bold uppercase tracking-wider border-b-4 transition-all",
              activeTab === "orders" 
                ? "border-slate-900 text-slate-900 bg-white shadow-sm rounded-t-lg" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={cn(
              "flex-1 py-3 text-sm font-bold uppercase tracking-wider border-b-4 transition-all",
              activeTab === "menu" 
                ? "border-emerald-500 text-emerald-700 bg-white shadow-sm rounded-t-lg" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Menu Manager
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl p-6">
        
        {/* --- TAB 1: ORDERS --- */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Coffee className="h-16 w-16 mb-4 opacity-10" />
                <p className="font-medium">Kitchen is quiet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Status Indicator Line */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors", 
                    order.status === 'ready' ? "bg-emerald-500" : 
                    order.status === 'preparing' ? "bg-amber-500" : "bg-slate-200"
                  )} />

                  <div className="flex justify-between items-start mb-4 pl-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{order.id}</span>
                        <span className="text-xs text-slate-400">{order.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mt-1">{order.customerName}</h3>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-black text-slate-900">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-6 pl-3 border-t border-slate-50 pt-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm items-start">
                        <span className="text-slate-700 font-medium flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-xs">{item.quantity}x</span> 
                          {item.item.name}
                        </span>
                        {item.instructions && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded max-w-[120px] truncate">{item.instructions}</span>}
                      </div>
                    ))}
                  </div>

                  {/* ACTION BUTTONS (Restored) */}
                  <div className="flex gap-3 pl-3">
                    {order.status === 'sent' && (
                      <button onClick={() => onUpdateStatus(order.id, "preparing")} className="flex-1 bg-amber-100 text-amber-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors shadow-sm">
                        <ChefHat className="w-5 h-5" /> Start Cooking
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => onUpdateStatus(order.id, "ready")} className="flex-1 bg-emerald-100 text-emerald-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors shadow-sm">
                        <CheckCircle className="w-5 h-5" /> Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div className="flex-1 bg-slate-50 text-slate-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-100">
                        <CheckCircle className="w-5 h-5" /> Order Complete
                      </div>
                    )}
                    
                    <button onClick={() => setOrderToDelete(order.id)} className="p-3 bg-white border-2 border-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 2: MENU MANAGER --- */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search menu..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            <div className="grid gap-3">
              {filteredMenu.map((item) => (
                <div key={item.id} className={cn("flex items-center justify-between p-4 rounded-xl border transition-all shadow-sm", item.available ? "bg-white border-slate-100" : "bg-slate-50 border-slate-100 opacity-60")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-1.5 h-10 rounded-full", item.available ? "bg-emerald-500" : "bg-slate-300")} />
                    <div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Price Edit */}
                    {editingItem === String(item.id) ? (
                      <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-emerald-500">
                        <input 
                          type="number" 
                          value={tempPrice} 
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-16 bg-transparent text-sm font-bold text-center focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => savePrice(item.id)} className="p-1 text-emerald-600 bg-white rounded shadow-sm"><Save className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEditing(item.id, item.price)} className="text-sm font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                        ₹{item.price} <Edit3 className="w-3 h-3 opacity-30" />
                      </button>
                    )}

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={cn(
                        "w-10 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none",
                        item.available ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300", item.available ? "translate-x-4" : "translate-x-0")} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- FLOATING "END DAY" BUTTON --- */}
      <button 
        onClick={() => setShowEndDayModal(true)} 
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-slate-900 px-6 py-4 font-bold text-white shadow-xl transition-transform hover:scale-105 hover:bg-slate-800 active:scale-95"
      >
        <RefreshCw className="h-5 w-5" /> End Day
      </button>

      {/* --- END DAY REPORT MODAL --- */}
      {showEndDayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl scale-100">
            <div className="flex justify-between items-start">
              <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <button onClick={() => setShowEndDayModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="h-6 w-6 text-slate-400" /></button>
            </div>
            
            <h2 className="mt-6 text-2xl font-black text-slate-900">End of Day Report</h2>
            <p className="text-slate-500 mb-8">Summary of today's business.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Orders</p>
                <p className="mt-1 text-3xl font-black text-slate-900">{daySummary.count}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Revenue</p>
                <p className="mt-1 text-3xl font-black text-emerald-700">₹{daySummary.revenue}</p>
              </div>
            </div>

            <button onClick={handleEndDay} className="mt-8 w-full rounded-xl bg-slate-900 py-4 font-bold text-white shadow-lg active:scale-95 transition-transform">
              Confirm & Reset System
            </button>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Delete Order?</h3>
            <p className="text-slate-500 mt-2 text-sm">This action cannot be undone.</p>
            
            <div className="mt-6 flex gap-3">
              <button onClick={() => setOrderToDelete(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPortal;