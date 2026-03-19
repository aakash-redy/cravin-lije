import { useState } from "react";
import { Trash2, CheckCircle, ChefHat, Coffee, X, Edit3, Save, Ban, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/pages/Index"; // Ensure this import path matches your project

// Types for Props
interface AdminPortalProps {
  orders: any[];
  menuItems: any[]; // NEW: We receive the menu data here
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
  onUpdateMenu: (updatedItems: any[]) => void; // NEW: Function to save menu changes
}

const AdminPortal = ({ orders, menuItems, onUpdateStatus, onDelete, onUpdateMenu }: AdminPortalProps) => {
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  
  // Local state for editing menu items to prevent lag while typing
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  // --- Handlers ---

  const handleToggleAvailability = (id: number) => {
    const updated = menuItems.map(item => 
      item.id === id ? { ...item, available: !item.available } : item
    );
    onUpdateMenu(updated);
  };

  const startEditing = (id: number, currentPrice: number) => {
    setEditingItem(String(id));
    setTempPrice(String(currentPrice));
  };

  const savePrice = (id: number) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      const updated = menuItems.map(item => 
        item.id === id ? { ...item, price: newPrice } : item
      );
      onUpdateMenu(updated);
    }
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white px-6 py-4 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          Admin Portal
        </h1>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all", activeTab === "orders" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
          >
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={cn("px-4 py-2 rounded-md text-sm font-bold transition-all", activeTab === "menu" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
          >
            Menu Manager
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6">
        
        {/* --- TAB 1: LIVE ORDERS --- */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Coffee className="h-16 w-16 mb-4 opacity-20" />
                <p>No active orders yet.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md border border-slate-100">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{order.id}</span>
                        <h3 className="text-xl font-bold text-slate-800">{order.customerName}</h3>
                      </div>
                      <div className="mt-2 text-sm text-slate-400">
                        {order.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">₹{order.total}</div>
                      <div className={cn("mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", 
                        order.status === "ready" ? "bg-emerald-100 text-emerald-700" : 
                        order.status === "preparing" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {order.status === "sent" && "New Order"}
                        {order.status === "preparing" && "Cooking"}
                        {order.status === "ready" && "Ready"}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-600">{item.quantity}x</span>
                          {item.item.name}
                          {item.isSugarFree && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">SF</span>}
                        </span>
                        {item.instructions && <span className="text-xs text-amber-600 italic">"{item.instructions}"</span>}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3 pt-4">
                    {order.status === "sent" && (
                      <button onClick={() => onUpdateStatus(order.id, "preparing")} className="flex-1 rounded-xl bg-amber-100 py-3 font-bold text-amber-700 hover:bg-amber-200 flex items-center justify-center gap-2">
                        <ChefHat className="h-5 w-5" /> Start Cooking
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button onClick={() => onUpdateStatus(order.id, "ready")} className="flex-1 rounded-xl bg-emerald-100 py-3 font-bold text-emerald-700 hover:bg-emerald-200 flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5" /> Mark Ready
                      </button>
                    )}
                    <button onClick={() => onDelete(order.id)} className="rounded-xl bg-slate-100 px-4 text-slate-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- TAB 2: MENU MANAGER --- */}
        {activeTab === "menu" && (
          <div className="grid gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className={cn("flex items-center justify-between rounded-xl p-4 border transition-all", item.available ? "bg-white border-slate-100" : "bg-slate-50 border-slate-100 opacity-60")}>
                
                {/* Left: Item Info */}
                <div className="flex items-center gap-4">
                  <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center text-xl bg-slate-100", !item.available && "grayscale")}>
                    {/* Placeholder for icon if you have one, or first letter */}
                    {item.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-6">
                  
                  {/* Price Editor */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-400">₹</span>
                    {editingItem === String(item.id) ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          value={tempPrice} 
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-16 rounded border border-emerald-500 px-2 py-1 text-sm font-bold focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => savePrice(item.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Save className="h-4 w-4"/></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startEditing(item.id, item.price)} 
                        className="text-lg font-black text-slate-700 hover:text-emerald-600 flex items-center gap-2"
                      >
                        {item.price} <Edit3 className="h-3 w-3 opacity-20" />
                      </button>
                    )}
                  </div>

                  {/* Availability Toggle */}
                  <button
                    onClick={() => handleToggleAvailability(item.id)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                      item.available ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  >
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out", item.available ? "translate-x-6" : "translate-x-1")} />
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