

import type { Timestamp } from 'firebase/firestore';

export type PayInPart = {
  id?: string;
  package_id?: string;
  plan_name: string;
  months: number;
  monthly_payment: number;
  processing_fee?: number | null;
  total_amount: number;
  is_active?: boolean;
};

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
  pay_in_parts: PayInPart[];
  description: string;
  highlights: string | null;
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
  trip_day_id: string;
  activity_time?: string | null; // time without time zone
  title: string;
  description?: string | null;
  activity_type?: 'trekking' | 'sightseeing' | 'meal' | 'transport' | 'accommodation' | 'adventure' | 'shopping' | 'leisure' | 'food' | 'explore' | 'stay' | null;
  place_id?: string | null;
  duration_minutes?: number | null;
  travel_duration_minutes?: number | null;
  cost_included?: boolean | null;
  additional_cost?: number | null;
  booking_required?: boolean | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TripDay = {
  id: string;
  package_id: string;
  day_number: number;
  day_name: string;
  title?: string;
  description?: string;
  meals_included?: string[];
  activities: Activity[];
  created_at: string;
  updated_at: string;
  tour_package?: { name: string } | null;
  special_instructions?: string | null;
};

export type TripLocation = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  image_urls: string[] | null;
  place_type: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
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
