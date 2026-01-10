
'use client';

import * as React from 'react';
import { getTourPackages, getBookings, getReviews, getProfiles, getTripDays, getOperators, getTripLocations } from '@/lib/supabase/queries';
import type { TourPackage, Booking, Review, Profile, TripDay, Operator, TripLocation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, BookCopy, Users, UserPlus, Package, Calendar, UserCog, MapPin, UserCheck, UserX, User, Sailboat } from 'lucide-react';
import { BookingCancellationChart } from '@/components/dashboard/charts/BookingCancellationChart';
import { BookingSummaryChart } from '@/components/dashboard/charts/BookingSummaryChart';
import { PopularPackagesTable } from '@/components/dashboard/tables/PopularPackagesTable';
import { ExpiringPackagesTable } from '@/components/dashboard/tables/ExpiringPackagesTable';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const StatItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-center gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-full">
            {icon}
        </div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    </div>
);

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
            { label: 'Total Sales', value: formatCurrency(totalSales), icon: <DollarSign className="h-5 w-5"/> },
            { label: 'Amount Received', value: formatCurrency(totalReceived), icon: <BookCopy className="h-5 w-5"/> },
            { label: 'Amount Pending', value: formatCurrency(Math.max(0, totalPending)), icon: <BookCopy className="h-5 w-5"/> }
          ],
          customerSummary: [
            { label: 'Booked Customers', value: bookedCustomers, icon: <UserCheck className="h-5 w-5"/> },
            { label: 'Unbooked Customers', value: unbookedCustomers, icon: <UserX className="h-5 w-5"/> }
          ],
          packageOverview: [
            { label: 'Total Tours', value: packages.length, icon: <Package className="h-5 w-5"/> },
            { label: 'Total Trip Days', value: tripDays.length, icon: <Calendar className="h-5 w-5"/> },
            { label: 'Total Operators', value: operators.length, icon: <UserCog className="h-5 w-5"/> },
            { label: 'Total Customers', value: profiles.length, icon: <Users className="h-5 w-5"/> },
            { label: 'Total Locations', value: locations.length, icon: <MapPin className="h-5 w-5"/> }
          ],
          operatorSummary: [
            { label: 'Referred Operators', value: referredOperators, icon: <UserPlus className="h-5 w-5"/> },
            { label: 'Un-referred Operators', value: unReferredOperators, icon: <User className="h-5 w-5"/> }
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Booking Overview</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.bookingOverview.map((stat:any) => <StatItem key={stat.label} {...stat} />)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Customer Summary</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.customerSummary.map((stat:any) => <StatItem key={stat.label} {...stat} />)}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Package Overview</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {stats.packageOverview.map((stat:any) => <StatItem key={stat.label} {...stat} />)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Operator Summary</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stats.operatorSummary.map((stat:any) => <StatItem key={stat.label} {...stat} />)}
              </CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <BookingCancellationChart data={chartData.lineChartData} />
             <BookingSummaryChart data={chartData.curveChartData} />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PopularPackagesTable data={tableData.popularPackages} />
            <ExpiringPackagesTable data={tableData.expiringPackages} />
        </div>
    </div>
  );
}

    