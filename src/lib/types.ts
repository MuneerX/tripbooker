
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
  trip_day_id: string;
  activity_time?: string | null; // time without time zone
  title: string;
  description?: string | null;
  activity_type?: 'trekking' | 'sight_seeing' | 'meal' | 'transport' | 'accommodation' | 'adventure' | 'shopping' | 'leisure' | null;
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
  accommodation_type?: string;
  accommodation_name?: string;
  meals_included?: string[];
  activities: Activity[];
  created_at: string;
  updated_at: string;
  tour_package?: { name: string } | null;
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
