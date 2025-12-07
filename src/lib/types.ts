

import type { Timestamp } from 'firebase/firestore';

export type TourPackage = {
  id: string;
  name: string;
  package_type: 'domestic' | 'international' | 'World' | 'India' | 'Kerala';
  category: 'adventure' | 'leisure' | 'pilgrimage' | 'cultural' | 'wildlife' | 'Family' | 'Premium' | 'LadiesOnly';
  base_price: number;
  days: number;
  nights: number;
  created_at: string;
  withdrawalDate: string;
  max_guests: number;
  itineraryId: string;
  image_urls: string[];
  payInParts: Array<{ partName: string; durationMonths: number; price: number }>;
  description: string;
  highlights: string[];
  inclusion: string;
  exclusion: string;
  booking_policy: string;
  cancellation_policy: string;
  terms_and_conditions: string;
  is_featured: boolean;
  featured_image_url: string | null;
  is_active: boolean;
  updated_at: string;
};

export type Activity = {
  id?: string;
  name: string;
  type: 'trekking' | 'sightseeing' | 'meal' | 'transport' | 'accommodation' | 'adventure' | 'shopping' | 'leisure';
  time: string; // HH:MM AM/PM
  duration: string;
  location: string;
  locationId?: string;
  price: number;
  price_included: boolean;
  booking_required: boolean;
  description: string;
  trip_day_id?: string;
};

export type TripDay = {
  id: string;
  day_name: string;
  day_number: number;
  description: string;
  special_instructions?: string;
  tour_package_id: string;
  activities: Activity[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type TripLocation = {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'landmark' | 'nature' | 'heritage' | 'beach' | 'mountain';
  country: string;
  state: string;
  district: string;
  city: string;
  code: string;
  description: string;
  address: string;
  images: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};

export type Booking = {
  id: string;
  tourPackageId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentType: 'full' | 'partial';
  transactionId: string;
  reservationDate: Date;
  travelDate: Date;
  referralCode: string;
  totalAmount: number;
  paidAmount: number;
  numberOfTravelers: number;
  createdAt: Date;
};

export type Review = {
  id: string;
  tourPackageId: string;
  userId: string;
  customerName: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
};

// For stats cards
export type StatCard = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
};

// For sidebar navigation
export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
};
