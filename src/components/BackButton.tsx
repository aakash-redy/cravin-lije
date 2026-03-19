import { ArrowLeft } from 'lucide-react'; 
// If you don't have lucide-react, install it or use a simple SVG

const BackButton = () => {
  const handleBack = () => {
    window.history.back(); // Simple browser back navigation
  };

  return (
    <button 
      onClick={handleBack}
      className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-gray-100 transition-all z-50 border border-gray-200"
      aria-label="Go back"
    >
      <ArrowLeft size={20} className="text-green-800" />
    </button>
  );
};

export default BackButton;