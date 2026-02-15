import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase"; // Make sure this is imported!
import { Check, ArrowLeft, Star, ChefHat, BellRing, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, customerName } = location.state || {};
  
  // 1. STATE: We track the LIVE status here
  const [status, setStatus] = useState(location.state?.status || 'sent');
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 2. REAL-TIME SUBSCRIPTION (The Magic)
  useEffect(() => {
    if (!orderId) return;

    // Listen for changes ONLY to this specific order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders', 
          filter: `id=eq.${orderId}` // Filter by ID so we don't get other people's updates
        },
        (payload) => {
          // Update the screen instantly when Admin changes status
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Window resize handler for confetti
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if no order ID (Safety)
  useEffect(() => {
    if (!orderId) {
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [orderId, navigate]);

  if (!orderId) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-bold">Redirecting...</div>;

  // --- HELPER: Get Content based on Status ---
  const getStatusContent = () => {
    switch (status) {
      case 'preparing':
        return {
          icon: <ChefHat className="w-10 h-10 text-orange-500" />,
          color: "bg-orange-100",
          title: "Cooking in Progress",
          desc: "The chef has started making your order!",
          textColor: "text-orange-600"
        };
      case 'ready':
        return {
          icon: <BellRing className="w-10 h-10 text-emerald-600" />,
          color: "bg-emerald-100",
          title: "Order Ready!",
          desc: "Please collect your order from the counter.",
          textColor: "text-emerald-600"
        };
      default: // 'sent'
        return {
          icon: <Utensils className="w-10 h-10 text-slate-500" />,
          color: "bg-slate-100",
          title: "Order Received",
          desc: "Waiting for the kitchen to accept...",
          textColor: "text-slate-600"
        };
    }
  };

  const currentStatus = getStatusContent();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Show Confetti ONLY when Ready */}
      {status === 'ready' && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      <motion.div 
        layout
        className="w-full max-w-sm bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl relative z-10 text-center"
      >
        {/* DYNAMIC ICON AREA */}
        <motion.div 
          key={status} // Animates when status changes
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-24 h-24 ${currentStatus.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-white transition-colors duration-500`}
        >
          {currentStatus.icon}
        </motion.div>

        <motion.h1 
          key={`${status}-title`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-black text-slate-900 mb-2"
        >
          {currentStatus.title}
        </motion.h1>

        <motion.p 
          key={`${status}-desc`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`font-bold text-sm mb-8 px-4 ${currentStatus.textColor}`}
        >
          {currentStatus.desc}
        </motion.p>

        {/* Order ID Badge */}
        <div className="inline-block bg-white px-4 py-2 rounded-xl border border-slate-200 mb-8 shadow-sm">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-2">Token</span>
           <span className="text-lg font-mono font-black text-slate-900">#{orderId.slice(0, 4)}</span>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex items-center justify-between px-2 mb-8 relative">
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-200 -z-10 rounded-full" />
          
          {/* Step 1: Sent */}
          <div className={`w-4 h-4 rounded-full border-4 border-white shadow-sm ${['sent', 'preparing', 'ready'].includes(status) ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
          
          {/* Step 2: Preparing */}
          <div className={`w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-500 ${['preparing', 'ready'].includes(status) ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
          
          {/* Step 3: Ready */}
          <div className={`w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-500 ${status === 'ready' ? 'bg-emerald-500 scale-125' : 'bg-slate-300'}`} />
        </div>

        {/* DYNAMIC BUTTONS */}
        <div className="space-y-3 w-full">
          
          {/* RATE BUTTON - ONLY SHOWS WHEN READY */}
          <AnimatePresence>
            {status === 'ready' && (
              <motion.button 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onClick={() => navigate('/feedback', { state: { customerName, orderId } })}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                RATE YOUR MEAL
              </motion.button>
            )}
          </AnimatePresence>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white border-2 border-slate-200 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Order More
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default OrderSuccess;