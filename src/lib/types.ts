import type { Timestamp } from 'firebase/firestore';

export type TourPackage = {
  id: string;
  tourName: string;
  tourType: 'domestic' | 'international';
  category: 'adventure' | 'leisure' | 'pilgrimage' | 'cultural' | 'wildlife';
  basePrice: number;
  days: number;
  nights: number;
  introductionDate: Date;
  withdrawalDate: Date;
  maxPermittedBooking: number;
  itineraryId: string;
  imageUrl: string;
  payInParts: Array<{ partName: string; durationMonths: number; price: number }>;
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  bookingPolicies: string;
  cancellationPolicies: string;
  termsAndConditions: string;
  isFeatured: boolean;
  featuredImageUrl: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
};

export type Activity = {
  activityId: string;
  name: string;
  type: 'trekking' | 'sightseeing' | 'meal' | 'transport' | 'accommodation' | 'adventure' | 'shopping';
  time: string; // HH:MM AM/PM
  duration: string;
  location: string;
  locationId: string;
  price: number;
  priceIncluded: boolean;
  bookingRequired: boolean;
  description: string;
};

export type TripDay = {
  id: string;
  dayName: string;
  dayNumber: number;
  description: string;
  specialInstructions: string;
  departureLocation: string;
  numberOfStays: number;
  tourPackageId: string;
  activities: Activity[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
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
