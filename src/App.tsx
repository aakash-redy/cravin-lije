import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";

// --- PAGES ---
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import OrderSuccess from "./pages/OrderSuccess";
import Feedback from "./pages/Feedback"; 

const queryClient = new QueryClient();

// --- SCROLL TO TOP COMPONENT ---
// Resets view to top on page change
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

// --- ROUTING LOGIC ---
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        {/* 1. MAIN CUSTOMER MENU (Home) */}
        <Route path="/" element={<Index />} />
        
        {/* 2. THE SECRET BACKDOOR (Only for Owner) */}
        {/* Save this URL: chailije.com/cravin-owner-access-x7z */}
        <Route path="/cravin-owner-access-x7z" element={<AdminLogin />} />

        {/* 3. THE SECURITY TRAP (Honeypot) */}
        {/* If hackers try generic admin URLs, kick them back to the menu */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        {/* 4. UTILITY PAGES */}
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* 5. CATCH-ALL (404 Page) */}
        <Route path="*" element={<NotFound />} />
        
      </Routes>
    </AnimatePresence>
  );
};

// --- 404 PAGE ---
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-4">
    <div>
      <h1 className="text-6xl font-black text-slate-200 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Lost in the sauce?</h2>
      <p className="text-slate-500 font-medium mb-6">We couldn't find the page you're looking for.</p>
      <a href="/" className="inline-block bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-colors">
        Go back to Menu
      </a>
    </div>
  </div>
);

export default App;