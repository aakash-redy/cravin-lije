import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const OrderSuccess = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
    </div>
    <h1 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
    <p className="text-slate-500 mb-8 max-w-xs">Your order has been sent to the kitchen. We will notify you when it's ready.</p>
    <Link to="/" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">
      Back to Menu
    </Link>
  </div>
);

export default OrderSuccess;