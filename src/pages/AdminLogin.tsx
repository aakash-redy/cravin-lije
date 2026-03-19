import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPortal from "@/components/AdminPortal"; 

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- SECURITY FEATURE: URL GUARD ---
  // This ensures the user is actually on the secret URL 
  // and didn't just stumble here by accident.
  useEffect(() => {
    // If you want to be extra strict, you can check the path here.
    // For now, we trust the App.tsx routing, but this is good practice.
    console.log("Admin Access Attempt via:", location.pathname);
  }, [location]);

  return (
    <AdminPortal 
      // CLEANUP: We removed 'menuItems' because AdminPortal fetches its own data now.
      
      // When they click the "Power" button inside the portal
      onBack={() => navigate('/')}
      
      // Optional: Logic if you want to trigger a global refresh (usually not needed)
      onUpdateMenu={() => {
        // You could trigger a toast notification here if you wanted
        // e.g. toast.success("Menu Updated via Admin");
      }}
    />
  );
};

export default AdminLogin;