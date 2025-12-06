import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getStatusBadgeColor(status: 'active' | 'inactive' | 'pending' | 'confirmed' | 'cancelled' | 'completed') {
  switch (status) {
    case 'active':
    case 'completed':
      return 'text-green-600 border-green-600/20 bg-green-500/10 hover:bg-green-500/20';
    case 'confirmed':
      return 'text-secondary-foreground bg-secondary hover:bg-secondary/80';
    case 'inactive':
    case 'cancelled':
      return 'text-red-600 border-red-600/20 bg-red-500/10 hover:bg-red-500/20';
    case 'pending':
      return 'text-yellow-600 border-yellow-600/20 bg-yellow-500/10 hover:bg-yellow-500/20';
    default:
      return 'text-gray-600 border-gray-600/20 bg-gray-500/10 hover:bg-gray-500/20';
  }
}
