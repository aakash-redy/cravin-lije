export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  health_benefit: string;
  sugarFree: boolean;
}

export const menuItems: MenuItem[] = [
  // Chai Varieties
  { id: 1, name: "Kadak Chai", price: 15, category: "Chai Varieties", health_benefit: "Instant energy boost.", sugarFree: false },
  { id: 2, name: "Kadak Chai Full", price: 18, category: "Chai Varieties", health_benefit: "Full-size energy kick.", sugarFree: false },
  { id: 3, name: "Ginger Chai", price: 20, category: "Chai Varieties", health_benefit: "Great for throat & immunity.", sugarFree: false },
  { id: 4, name: "Ginger Chai Full", price: 25, category: "Chai Varieties", health_benefit: "Full-size ginger goodness.", sugarFree: false },
  { id: 5, name: "Masala Chai", price: 25, category: "Chai Varieties", health_benefit: "Aids digestion.", sugarFree: false },
  { id: 6, name: "Azwain Chai", price: 25, category: "Chai Varieties", health_benefit: "Relieves bloating & gas.", sugarFree: false },
  { id: 7, name: "Cinnamon Chai", price: 25, category: "Chai Varieties", health_benefit: "Lowers blood sugar levels.", sugarFree: false },
  { id: 8, name: "Bellam Chai", price: 25, category: "Chai Varieties", health_benefit: "Iron-rich jaggery alternative.", sugarFree: false },
  { id: 9, name: "Allam Bellam Chai", price: 20, category: "Chai Varieties", health_benefit: "Best for cold & cough.", sugarFree: false },
  { id: 10, name: "Elachi Chai", price: 25, category: "Chai Varieties", health_benefit: "Refreshing and aromatic.", sugarFree: false },
  { id: 11, name: "Star Chai", price: 25, category: "Chai Varieties", health_benefit: "Unique star anise flavor.", sugarFree: false },

  // Coffee Varieties
  { id: 12, name: "Instant Coffee", price: 25, category: "Coffee Varieties", health_benefit: "Quick focus booster.", sugarFree: false },
  { id: 13, name: "Filter Coffee", price: 30, category: "Coffee Varieties", health_benefit: "Authentic south Indian taste.", sugarFree: false },
  { id: 14, name: "Black Coffee", price: 20, category: "Coffee Varieties", health_benefit: "Zero calories, pure caffeine.", sugarFree: true },
  { id: 15, name: "Bellam Coffee", price: 30, category: "Coffee Varieties", health_benefit: "Healthy jaggery energy.", sugarFree: false },
  { id: 16, name: "Thati Bellam Coffee", price: 30, category: "Coffee Varieties", health_benefit: "Palm jaggery richness.", sugarFree: false },
  { id: 17, name: "Sonti Coffee", price: 30, category: "Coffee Varieties", health_benefit: "Dry ginger aids digestion.", sugarFree: false },
  { id: 18, name: "Bullet Coffee", price: 25, category: "Coffee Varieties", health_benefit: "Sustained energy & focus.", sugarFree: true },
  { id: 19, name: "Sukku Coffee", price: 30, category: "Coffee Varieties", health_benefit: "Good for digestion.", sugarFree: true },

  // Milk Varieties
  { id: 20, name: "Badam Milk (Hot)", price: 25, category: "Milk Varieties", health_benefit: "Rich in protein & Vitamin E.", sugarFree: false },
  { id: 21, name: "Sonti Milk", price: 25, category: "Milk Varieties", health_benefit: "Dry ginger soothes stomach.", sugarFree: false },
  { id: 22, name: "Ragi Malt", price: 25, category: "Milk Varieties", health_benefit: "Calcium & iron rich.", sugarFree: false },
  { id: 23, name: "Golden Milk", price: 30, category: "Milk Varieties", health_benefit: "Strong anti-inflammatory.", sugarFree: false },
  { id: 24, name: "Horlicks", price: 25, category: "Milk Varieties", health_benefit: "Energy for students.", sugarFree: false },
  { id: 25, name: "Boost", price: 25, category: "Milk Varieties", health_benefit: "Stamina & energy.", sugarFree: false },
  { id: 26, name: "Pepper Milk", price: 25, category: "Milk Varieties", health_benefit: "Great for cold relief.", sugarFree: false },
  { id: 27, name: "Cardamom Milk", price: 20, category: "Milk Varieties", health_benefit: "Aromatic & soothing.", sugarFree: false },
  { id: 28, name: "Milk", price: 15, category: "Milk Varieties", health_benefit: "Pure & simple nutrition.", sugarFree: true },

  // Immunity Boosters
  { id: 29, name: "Green Tea", price: 20, category: "Immunity Boosters", health_benefit: "High in antioxidants.", sugarFree: true },
  { id: 30, name: "Lemon Tea", price: 20, category: "Immunity Boosters", health_benefit: "Vitamin C rich.", sugarFree: true },
  { id: 31, name: "Ginger Lemon Tea", price: 25, category: "Immunity Boosters", health_benefit: "Immunity & digestion boost.", sugarFree: true },
  { id: 32, name: "Black Tea", price: 20, category: "Immunity Boosters", health_benefit: "Antioxidant-rich classic.", sugarFree: true },
  { id: 33, name: "Tulasi Green Tea", price: 30, category: "Immunity Boosters", health_benefit: "Holy basil detox.", sugarFree: true },
  { id: 34, name: "Blue Tea", price: 25, category: "Immunity Boosters", health_benefit: "Rich in antioxidants.", sugarFree: true },
  { id: 35, name: "Traditional Kadha", price: 25, category: "Immunity Boosters", health_benefit: "Ultimate immunity shield.", sugarFree: true },
];

export const categories = [
  "Chai Varieties",
  "Coffee Varieties",
  "Milk Varieties",
  "Immunity Boosters",
];

export const categoryIcons: Record<string, string> = {
  "Chai Varieties": "☕",
  "Coffee Varieties": "🫖",
  "Milk Varieties": "🥛",
  "Immunity Boosters": "🌿",
};

// Items that CANNOT be made sugar-free (jaggery/pre-mix based)
export const SUGAR_FREE_BLACKLIST = [
  "Bellam Chai",
  "Allam Bellam Chai",
  "Bellam Coffee",
  "Thati Bellam Coffee",
  "Badam Milk (Hot)",
];
