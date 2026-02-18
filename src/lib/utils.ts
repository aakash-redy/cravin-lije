import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UI Helper ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Security Helper (The "Zero Knowledge" Hash) ---
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return "";
  
  // 1. Encode the password
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  
  // 2. Hash it using SHA-256 (Browser Native Security)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 3. Convert to Hex String (e.g., "a3f5...")
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// --- Formatting Helper (Bonus for Cravin) ---
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0, // No decimal points for prices like ₹50
  }).format(amount);
}