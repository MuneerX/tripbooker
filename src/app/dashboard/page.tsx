
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { RecentReviews } from '@/components/dashboard/RecentReviews';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Package, Book, Star, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { getTourPackages } from '@/lib/supabase/queries';
import mockData from '@/lib/data';
import type { TourPackage } from '@/lib/types';

export default function DashboardPage() {
  const [packages, setPackages] = React.useState<TourPackage[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const fetchedPackages = await getTourPackages();
      setPackages(fetchedPackages);
      setLoading(false);
    };
    fetchPackages();
  }, []);

  const totalRevenue = mockData.bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.paidAmount, 0);

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <DollarSign className="h-4 w-4" /> },
    { label: 'Total Bookings', value: mockData.bookings.length, icon: <Book className="h-4 w-4" /> },
    { label: 'Total Tours', value: packages.length, icon: <Package className="h-4 w-4" /> },
    { label: 'Total Reviews', value: mockData.reviews.length, icon: <Star className="h-4 w-4" /> },
  ];

  const quickActions = [
    { label: 'Create Tour', href: '/dashboard/tour-packages/create' },
    { label: 'Create Trip Day', href: '/dashboard/trip-days/create' },
    { label: 'Create Location', href: '/dashboard/trip-locations/create' },
  ];

  if (loading) {
    return (
        <div className="flex w-full flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded-md animate-pulse mt-2" />
                </div>
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-card rounded-lg p-4 space-y-2 border">
                        <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse" />
                        <div className="h-8 w-1/2 bg-muted rounded-md animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    )
  }

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Welcome back, Admin!</h1>
                <p className="text-muted-foreground">Here's a summary of your tour business.</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
                {quickActions.map(action => (
                    <Button asChild key={action.label}>
                        <Link href={action.href}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {action.label}
                        </Link>
                    </Button>
                ))}
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <StatCard key={stat.label} card={stat} />
          ))}
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentBookings />
          </div>
          <div className="xl:col-span-1">
            <RecentReviews />
          </div>
        </div>
      </div>
    </div>
  );
}
