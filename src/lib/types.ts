

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
  bookings: Booking[];
  reviews: Review[];
  trip_days?: TripDay[];
};

export type Activity = {
  id?: string;
  trip_day_id: string;
  activity_time?: string | null; // time without time zone
  title: string;
  description?: string | null;
  activity_type?: 'food' | 'explore' | 'stay' | null;
  place_id?: string | null;
  duration_minutes?: number | null;
  travel_duration_minutes?: number | null;
  cost_included?: boolean | null;
  additional_cost?: number | null;
  booking_required?: boolean | null;
  special_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
  place?: TripLocation | null;
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

type CustomerProfile = {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone_number: string | null;
};

export type BookingGuest = {
  id: string;
  booking_id: string;
  guest_type: string;
  title: string | null;
  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  age: number | null;
};

export type Payment = {
  id: string;
  amount: number;
  payment_method: string | null;
  transaction_id: string | null;
  order_id: string | null;
  created_at: string; // This is the payment date
  user_id: string | null;
  payment_status: string | null;
};

export type UserPipSchedule = {
  id: string;
  booking_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_date: string | null;
  order_id: string;
};

export type Booking = {
  id: string;
  order_id: string;
  user_id: string | null;
  package_id: string;
  booking_date: string;
  travel_date: string | null;
  total_adults: number;
  total_children: number;
  total_amount: number;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string | null;
  special_requests: string | null;
  created_at: string;
  transaction_id?: string | null;
  customer: CustomerProfile;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  avatar_url?: string | null;
  tour_package: TourPackage | null;
  referral_code?: string | null;
  guests?: BookingGuest[];
  payments?: Payment[];
  user_pip_schedules?: UserPipSchedule[];
  cancellation_reason?: string | null;
};


export type Review = {
  id: string;
  package_id: string;
  user_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  avatar_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
};

export type Profile = {
    id: string;
    updated_at: string | null;
    created_at: string;
    full_name: string;
    email: string;
    phone_number: string;
    whatsapp_number: string;
    dob: string | null;
    gender: string | null;
    address: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
    avatar_url: string | null;
    is_kv_customer: boolean;
    is_active: boolean | null;
    status: 'active' | 'inactive';
};

export type Operator = {
  id: string;
  name: string;
  code: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  total_reviews: number | null;
  description: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  referral_code: string | null;
  status: 'active' | 'blocked';
  commission_status: boolean;
  commission_type: 'percentage' | 'amount';
  commission_value: number;
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
