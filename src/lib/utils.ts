
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    // Format to 1 decimal place if it's not a whole number, otherwise show as integer
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `₹${formatted}L`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusBadgeColor(status: 'active' | 'inactive' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'new' | 'approved') {
  switch (status) {
    case 'active':
    case 'completed':
    case 'confirmed':
    case 'approved':
      return 'text-green-600 border-green-600/20 bg-green-500/10 hover:bg-green-500/20';
    case 'inactive':
    case 'cancelled':
      return 'text-red-600 border-red-600/20 bg-red-500/10 hover:bg-red-500/20';
    case 'pending':
    case 'new':
      return 'text-amber-600 border-amber-600/20 bg-amber-500/10 hover:bg-amber-500/20';
    default:
      return 'text-gray-600 border-gray-600/20 bg-gray-500/10 hover:bg-gray-500/20';
  }
}
