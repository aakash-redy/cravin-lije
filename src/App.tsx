import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

// --- PAGES ---
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import OrderSuccess from "./pages/OrderSuccess";
import Feedback from "./pages/Feedback"; // Ensure you created this file!

const queryClient = new QueryClient();

// --- SCROLL TO TOP COMPONENT ---
// This ensures that when you change pages, the view resets to the top
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- MAIN APP COMPONENT ---
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        
        {/* GLOBAL NOTIFICATIONS */}
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <ScrollToTop />
          
          {/* ANIMATED ROUTES WRAPPER */}
          <AnimatedRoutes />
          
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// --- SEPARATE COMPONENT FOR ANIMATIONS ---
// We need this separation so 'useLocation' works correctly
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        {/* 1. MAIN MENU (Home) */}
        <Route path="/" element={<Index />} />
        
        {/* 2. OWNER PORTAL (Secret Double-Tap Access) */}
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* 3. ORDER SUCCESS (Receipt Screen) */}
        <Route path="/order-success" element={<OrderSuccess />} />
        
        {/* 4. CUSTOMER FEEDBACK */}
        <Route path="/feedback" element={<Feedback />} />

        {/* 5. CATCH-ALL (404 Page) */}
        <Route path="*" element={<NotFound />} />
        
      </Routes>
    </AnimatePresence>
  );
};

// --- SIMPLE 404 PAGE ---
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-4">
    <div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">404</h1>
      <p className="text-slate-500 font-bold mb-4">Oops! This page doesn't exist.</p>
      <a href="/" className="text-emerald-600 font-black underline">Go back to Menu</a>
    </div>
  </div>
);

export default App;