
'use client';

import * as React from 'react';
import { getTourPackages, getBookings, getReviews, getProfiles, getTripDays, getOperators, getTripLocations } from '@/lib/supabase/queries';
import type { TourPackage, Booking, Review, Profile, TripDay, Operator, TripLocation } from '@/lib/types';
import { StatCard } from '@/components/dashboard/StatCard';
import { DollarSign, BookCopy, Users, UserPlus, Package, Calendar, UserCog, MapPin, UserCheck, UserX, User, Sailboat } from 'lucide-react';
import { BookingCancellationChart } from '@/components/dashboard/charts/BookingCancellationChart';
import { BookingSummaryChart } from '@/components/dashboard/charts/BookingSummaryChart';
import { PopularPackagesTable } from '@/components/dashboard/tables/PopularPackagesTable';
import { ExpiringPackagesTable } from '@/components/dashboard/tables/ExpiringPackagesTable';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<any>(null);
  const [chartData, setChartData] = React.useState<any>(null);
  const [tableData, setTableData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          packages,
          bookings,
          profiles,
          tripDays,
          operators,
          locations
        ] = await Promise.all([
          getTourPackages(),
          getBookings(),
          getProfiles(),
          getTripDays(),
          getOperators(),
          getTripLocations()
        ]);
        
        // --- Process Stats ---
        const totalSales = bookings
          .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
          .reduce((sum, b) => sum + b.total_amount, 0);

        const totalReceived = bookings.reduce((sum, b) => {
            const paid = b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
            return sum + paid;
        }, 0);
        
        const totalPending = totalSales - totalReceived;
        
        const bookedCustomerIds = new Set(bookings.map(b => b.user_id));
        const bookedCustomers = bookedCustomerIds.size;
        const unbookedCustomers = profiles.length - bookedCustomers;
        
        const referredOperators = operators.filter(o => o.referral_code).length;
        const unReferredOperators = operators.length - referredOperators;
        
        setStats({
          bookingOverview: [
            { label: 'Total Sales', value: formatCurrency(totalSales), icon: <DollarSign /> },
            { label: 'Amount Received', value: formatCurrency(totalReceived), icon: <BookCopy /> },
            { label: 'Amount Pending', value: formatCurrency(Math.max(0, totalPending)), icon: <BookCopy /> }
          ],
          customerSummary: [
            { label: 'Booked Customers', value: bookedCustomers, icon: <UserCheck /> },
            { label: 'Unbooked Customers', value: unbookedCustomers, icon: <UserX /> }
          ],
          packageOverview: [
            { label: 'Total Tours', value: packages.length, icon: <Package /> },
            { label: 'Total Trip Days', value: tripDays.length, icon: <Calendar /> },
            { label: 'Total Operators', value: operators.length, icon: <UserCog /> },
            { label: 'Total Customers', value: profiles.length, icon: <Users /> },
            { label: 'Total Locations', value: locations.length, icon: <MapPin /> }
          ],
          operatorSummary: [
            { label: 'Referred Operators', value: referredOperators, icon: <UserPlus /> },
            { label: 'Un-referred Operators', value: unReferredOperators, icon: <User /> }
          ],
        });
        
        // --- Process Chart Data ---
        const monthlyData: { [key: string]: { bookings: number, cancellations: number } } = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthNames.forEach(name => {
          monthlyData[name] = { bookings: 0, cancellations: 0 };
        });

        bookings.forEach(b => {
          const month = new Date(b.created_at).getMonth();
          const monthName = monthNames[month];
          if (b.booking_status === 'cancelled') {
            monthlyData[monthName].cancellations += b.total_amount;
          } else {
            monthlyData[monthName].bookings += b.total_amount;
          }
        });
        
        const lineChartData = monthNames.map(name => ({
          month: name,
          bookings: monthlyData[name].bookings,
          cancellations: monthlyData[name].cancellations,
        }));
        
        const curveChartData = monthNames.map(name => ({
            month: name,
            bookings: monthlyData[name].bookings,
        }));

        setChartData({ lineChartData, curveChartData });

        // --- Process Table Data ---
        const packageSales: { [key: string]: { name: string, price: number, quantity: number } } = {};
        packages.forEach(p => {
          packageSales[p.id] = { name: p.name, price: p.base_price, quantity: 0 };
        });
        
        bookings.forEach(b => {
          if (b.package_id && packageSales[b.package_id]) {
            packageSales[b.package_id].quantity += 1;
          }
        });

        const popularPackages = Object.values(packageSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const expiringPackages = packages.filter(p => {
            if (!p.withdrawalDate) return false;
            const expiryDate = new Date(p.withdrawalDate);
            return expiryDate > today && expiryDate <= thirtyDaysFromNow;
        }).sort((a,b) => new Date(a.withdrawalDate).getTime() - new Date(b.withdrawalDate).getTime());

        setTableData({ popularPackages, expiringPackages });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
        <div className="flex w-full flex-col gap-8 p-4 md:p-8">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
            </div>
        </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        
        {/* Booking Overview */}
        <div className="space-y-2">
            <h2 className="text-lg font-semibold">Booking Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.bookingOverview.map((stat:any) => <StatCard key={stat.label} card={stat} />)}
            </div>
        </div>
        
        {/* Customer Summary */}
        <div className="space-y-2">
            <h2 className="text-lg font-semibold">Customer Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {stats.customerSummary.map((stat:any) => <StatCard key={stat.label} card={stat} />)}
            </div>
        </div>

        {/* Package Overview */}
        <div className="space-y-2">
            <h2 className="text-lg font-semibold">Package Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                 {stats.packageOverview.map((stat:any) => <StatCard key={stat.label} card={stat} />)}
            </div>
        </div>

        {/* Operator Summary */}
        <div className="space-y-2">
            <h2 className="text-lg font-semibold">Operator Summary</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {stats.operatorSummary.map((stat:any) => <StatCard key={stat.label} card={stat} />)}
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <BookingCancellationChart data={chartData.lineChartData} />
             <BookingSummaryChart data={chartData.curveChartData} />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 gap-6">
            <PopularPackagesTable data={tableData.popularPackages} />
            <ExpiringPackagesTable data={tableData.expiringPackages} />
        </div>
    </div>
  );
}
