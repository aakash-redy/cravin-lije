import { motion } from "framer-motion";
import { Check, Coffee, ChefHat, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

// Matches the OrderStatus type from Index.tsx
type OrderStatus = "sent" | "preparing" | "ready";

interface OrderSuccessProps {
  name: string;
  status: OrderStatus;
  onNewOrder: () => void;
}

const OrderSuccess = ({ name, status, onNewOrder }: OrderSuccessProps) => {
  // Define the steps for the tracker
  const steps = [
    { id: "sent", label: "Order Sent", icon: Coffee },
    { id: "preparing", label: "Preparing", icon: ChefHat },
    { id: "ready", label: "Ready to Serve", icon: ShoppingBag },
  ];

  // Calculate which step is active (0, 1, or 2)
  const currentStepIndex = steps.findIndex((s) => s.id === status);
  
  // Logic to determine progress bar width (0%, 50%, or 100%)
  const progressWidth = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12 text-center">
      
      {/* Big Animated Success Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-emerald-200/50 shadow-lg"
      >
        <Check className="h-12 w-12 stroke-[4]" />
      </motion.div>

      {/* Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-black text-slate-900">Thank you, {name}!</h1>
        <p className="mt-2 text-base font-medium text-slate-500 max-w-xs mx-auto">
          {status === "ready" 
            ? "Your order is ready! Please pick it up at the counter." 
            : "Sit tight! We've received your order and the kitchen is on it."}
        </p>
      </motion.div>

      {/* --- LIVE TRACKER --- */}
      <div className="relative mt-16 w-full max-w-sm">
        {/* Background Gray Line */}
        <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-slate-100 rounded-full" />
        
        {/* Animated Green Progress Line */}
        <motion.div 
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-emerald-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

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
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted ? "#10b981" : "#ffffff",
                    borderColor: isCompleted ? "#10b981" : "#f1f5f9"
                  }}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-4 shadow-sm transition-colors duration-500 ${
                    isCompleted ? "text-white shadow-emerald-200" : "text-slate-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  isCompleted ? "text-emerald-600" : "text-slate-300"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* "Order Again" Button (Only appears when Ready or after a delay) */}
      <motion.div 
        className="mt-20 w-full max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={onNewOrder}
          className="group relative w-full overflow-hidden rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl transition-transform active:scale-95"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            Place Another Order <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      </motion.div>

    </div>
  );
};

export default OrderSuccess;