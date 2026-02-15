import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// --- Pages ---
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// You will need to create these empty placeholders if they don't exist yet, 
// or point them to Index for now.
import AdminLogin from "./pages/AdminLogin"; 
import OrderSuccess from "./pages/OrderSuccess"; 

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Keep menu data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't reload just because they swapped tabs
    },
  },
});

const App = () => {
  // Optional: Set the mobile browser theme color to match Cravin brand
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", "#0f172a"); // Slate-900 (Your Brand Color)
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toast Notifications */}
        <Toaster />
        <Sonner position="top-center" richColors closeButton />
        
        <BrowserRouter>
          <Routes>
            {/* 1. Main Customer Landing (Default Shop) */}
            <Route path="/" element={<Index />} />

            {/* 2. Multi-Tenant Dynamic Shop Route 
                Example: cravin.in/jntu-canteen 
                (Index page will read the ID from URL) 
            */}
            <Route path="/shop/:shopId" element={<Index />} />

            {/* 3. Secure Admin Portal */}
            <Route path="/admin" element={<AdminLogin />} />

            {/* 4. Post-Checkout Experience */}
            <Route path="/order-success" element={<OrderSuccess />} />

            {/* 5. Catch-All for 404s */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;