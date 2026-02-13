import { motion } from "framer-motion";
import { Check, Coffee, ChefHat, ShoppingBag, ArrowLeft, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";

// Matches the OrderStatus type from Index.tsx
type OrderStatus = "sent" | "preparing" | "ready";

interface OrderSuccessProps {
  name: string;
  status: OrderStatus;
  onNewOrder: () => void;
}

const OrderSuccess = ({ name, status, onNewOrder }: OrderSuccessProps) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- SMART NEWS FETCHING (Production Ready) ---
  useEffect(() => {
    const fetchNews = async () => {
      // 1. Check Local Storage first (Cache Strategy)
      const cachedData = localStorage.getItem("cravin-news-cache");
      const cachedTime = localStorage.getItem("cravin-news-time");
      
      const now = new Date().getTime();
      const twelveHours = 12 * 60 * 60 * 1000;

      // If we have data and it's less than 12 hours old, USE IT (Saves API Quota)
      if (cachedData && cachedTime && (now - Number(cachedTime) < twelveHours)) {
        console.log("Loading news from cache (Saving API calls)...");
        setNews(JSON.parse(cachedData));
        setLoading(false);
        return;
      }

      // 2. If no cache, Fetch from API
      console.log("Fetching fresh news from GNews...");
      const API_KEY = import.meta.env.VITE_GNEWS_API_KEY; // Your Key
      const URL = `https://gnews.io/api/v4/top-headlines?category=business&lang=en&country=in&max=3&apikey=${API_KEY}`;

      try {
        const res = await fetch(URL);
        const data = await res.json();
        
        if (data.articles) {
          const cleanNews = data.articles.map((item: any) => ({
            title: item.title,
            url: item.url,
            source: { name: item.source.name },
            publishedAt: item.publishedAt
          }));

          setNews(cleanNews);
          
          // Save to Cache so we don't fetch again for 12 hours
          localStorage.setItem("cravin-news-cache", JSON.stringify(cleanNews));
          localStorage.setItem("cravin-news-time", String(now));
        }
      } catch (error) {
        console.error("News fetch failed", error);
        // Fallback: If API fails (quota exceeded), show static backup so UI doesn't break
        setNews([
           { title: "Cravin' is expanding to new locations soon!", source: { name: "Cravin News" }, url: "#", publishedAt: new Date().toISOString() },
           { title: "Tech industry sees massive growth in AI sector", source: { name: "Tech Daily" }, url: "#", publishedAt: new Date().toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // --- TRACKER STEPS ---
  const steps = [
    { id: "sent", label: "Sent", icon: Coffee },
    { id: "preparing", label: "Brewing", icon: ChefHat },
    { id: "ready", label: "Ready", icon: ShoppingBag },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === status);
  // Calculate progress width (0% -> 50% -> 100%)
  const progressWidth = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-y-auto">
      
      {/* Top Bar with Back Button */}
      <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md p-4 flex items-center border-b border-slate-100">
        <button 
          onClick={onNewOrder} 
          className="p-2 -ml-2 rounded-full hover:bg-white hover:shadow-sm text-slate-600 transition-all active:scale-95 group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        <span className="ml-2 font-bold text-slate-700">Back to Menu</span>
      </div>

      <div className="flex-1 flex flex-col items-center pt-8 px-6 pb-12 text-center">
        
        {/* Success Icon Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-100/50"
        >
          <Check className="h-10 w-10 stroke-[4]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl font-black text-slate-900">Thank you, {name}!</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-[250px] mx-auto">
            {status === "ready" 
              ? "Your chai is ready! Please pick it up at the counter." 
              : "Sit tight! We've received your order and the kitchen is on it."}
          </p>
        </motion.div>

        {/* Live Status Tracker */}
        <div className="relative mt-12 w-full max-w-xs">
          {/* Gray Background Line */}
          <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 bg-slate-200 rounded-full" />
          
          {/* Animated Green Progress Line */}
          <motion.div 
            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 bg-emerald-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progressWidth}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />

          {/* Step Icons */}
          <div className="relative z-10 flex justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isActive ? 1.2 : 1,
                      backgroundColor: isCompleted ? "#10b981" : "#ffffff",
                      borderColor: isCompleted ? "#10b981" : "#e2e8f0"
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-4 shadow-sm transition-colors duration-500 ${
                      isCompleted ? "text-white shadow-lg shadow-emerald-200" : "text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                  
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isCompleted ? "text-emerald-600" : "text-slate-300"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* News Feed Section */}
        <motion.div 
          className="mt-16 w-full max-w-md text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-4 px-1">
            <Newspaper className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Top Headlines (India)
            </h3>
          </div>

          <div className="space-y-3">
            {loading ? (
               // Loading Skeleton
               [1, 2, 3].map((k) => (
                 <div key={k} className="h-20 w-full animate-pulse rounded-2xl bg-white border border-slate-100" />
               ))
            ) : (
              news.map((n, i) => (
                <a 
                  key={i} 
                  href={n.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all hover:border-emerald-200 hover:shadow-md"
                >
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-relaxed group-hover:text-emerald-700 transition-colors">
                    {n.title}
                  </h4>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      {n.source.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                    </span>
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