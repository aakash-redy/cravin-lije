import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/chai-lije-logo.png";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

const Header = ({ cartCount, onCartClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Chai Lije" className="h-10 rounded-md" />
        </div>
        <button
          onClick={onCartClick}
          className="relative rounded-full bg-primary-foreground/10 p-2.5 transition-colors hover:bg-primary-foreground/20"
        >
          <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
            >
              {cartCount}
            </motion.span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
