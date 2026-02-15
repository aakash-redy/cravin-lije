import { motion } from "framer-motion";
import { Check, Coffee, ChefHat, ShoppingBag, ArrowLeft, Newspaper, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// Types
type OrderStatus = "sent" | "preparing" | "ready" | "delivered";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Get Data Passed from Checkout
  const { orderId, customerName, shopId } = location.state || {};
  
  // State
  const [status, setStatus] = useState<OrderStatus>("sent");
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // --- 2. REAL-TIME STATUS UPDATES (The "Magic") ---
  useEffect(() => {
    if (!orderId) return;

    // A. Fetch Initial Status
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();
      if (data) setStatus(data.status);
    };
    fetchStatus();

    // B. Subscribe to Live Changes
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          console.log("Status Updated!", payload.new.status);
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [orderId]);

  // --- 3. SMART NEWS FETCHING (Cache Logic) ---
  useEffect(() => {
    const fetchNews = async () => {
      // Check Cache to save API calls
      const cachedData = localStorage.getItem("cravin-news-cache");
      const cachedTime = localStorage.getItem("cravin-news-time");
      const now = Date.now();
      const twelveHours = 12 * 60 * 60 * 1000;

      if (cachedData && cachedTime && (now - Number(cachedTime) < twelveHours)) {
        setNews(JSON.parse(cachedData));
        setLoadingNews(false);
        return;
      }

      // Fetch Live
      try {
        const API_KEY = import.meta.env.VITE_GNEWS_API_KEY; 
        if (!API_KEY) throw new Error("No API Key");
        
        const res = await fetch(`https://gnews.io/api/v4/top-headlines?category=technology&lang=en&country=in&max=3&apikey=${API_KEY}`);
        const data = await res.json();
        
        if (data.articles) {
          const cleanNews = data.articles.map((item: any) => ({
            title: item.title,
            url: item.url,
            source: item.source.name,
            time: item.publishedAt
          }));
          setNews(cleanNews);
          localStorage.setItem("cravin-news-cache", JSON.stringify(cleanNews));
          localStorage.setItem("cravin-news-time", String(now));
        }
      } catch (e) {
        // Fallback Content
        setNews([
           { title: "Cravin' is expanding to JNTUH Canteen soon!", source: "Cravin Blog", url: "#" },
           { title: "Student startup revolutionizes food delivery in Hyderabad", source: "Campus News", url: "#" },
        ]);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  // --- Logic: Progress Bar ---
  const steps = [
    { id: "sent", label: "Sent", icon: Coffee },
    { id: "preparing", label: "Brewing", icon: ChefHat },
    { id: "ready", label: "Ready", icon: ShoppingBag },
  ];
  
  // Helper to handle "Delivered" state which is essentially "Ready" + Done
  const displayStatus = status === 'delivered' ? 'ready' : status;
  const currentStepIndex = steps.findIndex((s) => s.id === displayStatus);
  const progressWidth = Math.max(0, (currentStepIndex / (steps.length - 1)) * 100);

  // --- Navigation Handler ---
  const handleBackToMenu = () => {
    // Navigate back to specific shop if ID exists, else root
    navigate(shopId ? `/shop/${shopId}` : '/');
  };

  if (!location.state) {
    // Fallback if someone visits /order-success directly
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <button onClick={() => navigate('/')} className="text-slate-500 font-bold underline">Return to Home</button>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-y-auto font-sans">
      
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-100">
        <button 
          onClick={handleBackToMenu} 
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
             <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="font-bold text-sm">Menu</span>
        </button>
        {shopId && (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-100 px-2 py-1 rounded">
                {shopId.replace('-', ' ')}
            </span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center pt-10 px-6 pb-12 text-center">
        
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 100 }}
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30"
        >
          <Check className="h-12 w-12 stroke-[4]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Got it, {customerName}!</h1>
          <p className="text-base font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
            {status === "ready" 
              ? <span className="text-emerald-600 font-bold">Your order is ready at the counter!</span> 
              : "Sit back and relax. We'll notify you when it's ready."}
          </p>
          {orderId && <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Order ID: #{orderId.slice(0,4)}</p>}
        </motion.div>

        {/* --- LIVE TRACKER --- */}
        <div className="relative mt-16 w-full max-w-xs">
          {/* Track Line */}
          <div className="absolute left-0 top-5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-emerald-500"
               initial={{ width: "0%" }}
               animate={{ width: `${progressWidth}%` }}
               transition={{ duration: 1, ease: "circOut" }}
             />
          </div>

          {/* Steps */}
          <div className="relative z-10 flex justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center gap-3">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isActive ? 1.25 : 1,
                      backgroundColor: isCompleted ? "#10b981" : "#ffffff",
                      borderColor: isCompleted ? "#10b981" : "#e2e8f0"
                    }}
                    className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full border-4 shadow-sm transition-colors duration-300",
                        isCompleted ? "text-white shadow-emerald-200 shadow-lg" : "text-slate-300"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  
                  <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider transition-colors duration-300",
                      isCompleted ? "text-emerald-600" : "text-slate-300"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- NEWS WIDGET --- */}
        <motion.div 
          className="mt-20 w-full max-w-sm text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                    <Newspaper className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                While you wait
                </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Powered by Cravin</span>
          </div>

          <div className="space-y-3">
            {loadingNews ? (
               // Skeletons
               [1, 2].map((k) => (
                 <div key={k} className="h-24 w-full animate-pulse rounded-2xl bg-white border border-slate-100 shadow-sm" />
               ))
            ) : (
              news.map((n, i) => (
                <a 
                  key={i} 
                  href={n.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group block bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.98] transition-all hover:border-indigo-100 hover:shadow-indigo-500/10 hover:shadow-lg"
                >
                  <div className="flex justify-between items-start gap-4">
                      <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-relaxed group-hover:text-indigo-600 transition-colors">
                        {n.title}
                      </h4>
                      {/* Optional: Add image thumbnail logic here if API provides it */}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50/50">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {n.source}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Read More →</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default OrderSuccess;