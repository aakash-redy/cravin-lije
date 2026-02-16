import { useNavigate } from "react-router-dom";
import AdminPortal from "@/components/AdminPortal"; // Ensure this path is correct

const AdminLogin = () => {
  const navigate = useNavigate();

  return (
    <AdminPortal 
      // The AdminPortal now fetches its own data, so we don't need to pass 'orders'
      menuItems={[]} 
      
      // When the user clicks "Power" or "Logout" inside the portal
      onBack={() => navigate('/')}
      
      // Optional: If you want to trigger a refresh elsewhere (usually not needed now)
      onUpdateMenu={() => console.log("Menu updated")}
    />
  );
};

export default AdminLogin;