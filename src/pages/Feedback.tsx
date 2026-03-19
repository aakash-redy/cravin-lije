import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Star, Send, ArrowLeft, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Feedback = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // We pass customerName from OrderSuccess
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Rate us!", description: "Please select a star rating.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('feedback')
      .insert([{
        customer_name: state?.customerName || "Anonymous",
        rating: rating,
        comment: comment
      }]);

    if (error) {
      toast({ title: "Error", description: "Could not save feedback.", variant: "destructive" });
    } else {
      toast({ title: "Thank You!", description: "We love hearing from you." });
      navigate('/'); // Go back to menu
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-yellow-50 rounded-full blur-3xl -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <button onClick={() => navigate('/')} className="mb-8 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>

        <h1 className="text-3xl font-black text-slate-900 mb-2">Rate your Meal 😋</h1>
        <p className="text-slate-500 font-bold text-sm mb-8">Tell us what you loved!</p>

        {/* Star Rating System */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileTap={{ scale: 0.8 }}
              onClick={() => setRating(star)}
              className="p-1 focus:outline-none"
            >
              <Star 
                className={`w-10 h-10 transition-colors ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
              />
            </motion.button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider ml-1">Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="The chai was amazing..."
              className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-slate-900 focus:outline-none font-bold text-slate-900 resize-none transition-colors placeholder:text-slate-300"
            />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "SUBMIT FEEDBACK"}
            {!isSubmitting && <Send className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by Aakash
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Feedback;