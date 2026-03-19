import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase"; 
import { Check, ArrowLeft, Star, ChefHat, BellRing, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // We grab shopId here so we know exactly where to route back to!
  const { orderId, customerName, shopId } = location.state || {};
  
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
          icon: <ChefHat className="w-10 h-10 text-emerald-400" />,
          color: "bg-slate-900 shadow-lg shadow-slate-900/20",
          title: "Cooking in Progress",
          desc: "The chef has started making your order!",
          textColor: "text-slate-500"
        };
      case 'ready':
        return {
          icon: <BellRing className="w-10 h-10 text-white" />,
          color: "bg-emerald-500 shadow-lg shadow-emerald-500/30",
          title: "Order Ready!",
          desc: "Please collect your order from the counter.",
          textColor: "text-emerald-600"
        };
      default: // 'sent'
        return {
          icon: <Utensils className="w-10 h-10 text-emerald-400" />,
          color: "bg-slate-900 shadow-lg shadow-slate-900/20",
          title: "Order Received",
          desc: "Waiting for the kitchen to accept...",
          textColor: "text-slate-500"
        };
    }
  };

  const currentStatus = getStatusContent();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
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
        className="w-full max-w-sm bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl relative z-10 text-center flex flex-col items-center"
      >
        {/* DYNAMIC ICON AREA */}
        <motion.div 
          key={status} // Animates when status changes
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-20 h-20 ${currentStatus.color} rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-500`}
        >
          {currentStatus.icon}
        </motion.div>

        <motion.h1 
          key={`${status}-title`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-black text-slate-900 mb-2 tracking-tight"
        >
          {currentStatus.title}
        </motion.h1>

        <motion.p 
          key={`${status}-desc`}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`font-bold text-sm mb-10 px-4 ${currentStatus.textColor}`}
        >
          {currentStatus.desc}
        </motion.p>

        {/* PROGRESS BAR */}
        <div className="w-full flex items-center justify-between px-2 mb-10 relative">
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 top-1/2 h-1.5 bg-slate-100 -z-10 rounded-full" />
          
          {/* Step 1: Sent */}
          <div className={`w-5 h-5 rounded-full z-10 border-4 border-white shadow-sm transition-all duration-500 ${['sent', 'preparing', 'ready'].includes(status) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          
          {/* Step 2: Preparing */}
          <div className={`w-5 h-5 rounded-full z-10 border-4 border-white shadow-sm transition-all duration-500 ${['preparing', 'ready'].includes(status) ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          
          {/* Step 3: Ready */}
          <div className={`w-5 h-5 rounded-full z-10 border-4 border-white shadow-sm transition-all duration-500 ${status === 'ready' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
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
                onClick={() => navigate('/feedback', { state: { customerName, orderId, shopId } })}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mb-3"
              >
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                RATE YOUR MEAL
              </motion.button>
            )}
          </AnimatePresence>

          <button 
            // THIS IS THE MAGIC LINE: Sends them back to the menu with the activeOrderId!
            onClick={() => navigate(`/${shopId || ''}`, { state: { activeOrderId: orderId } })}
            className="w-full bg-white border-2 border-slate-200 text-slate-700 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Order More
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default OrderSuccess;