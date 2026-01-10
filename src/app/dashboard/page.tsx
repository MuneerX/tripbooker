
'use client';

import * as React from 'react';
import { getTourPackages, getBookings, getReviews, getProfiles, getTripDays, getOperators, getTripLocations } from '@/lib/supabase/queries';
import type { TourPackage, Booking, Review, Profile, TripDay, Operator, TripLocation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, BookCopy, Users, UserPlus, Package, Calendar, UserCog, MapPin, UserCheck, UserX, User, Sailboat, TrendingUp, CalendarX } from 'lucide-react';
import { BookingCancellationChart } from '@/components/dashboard/charts/BookingCancellationChart';
import { BookingSummaryChart } from '@/components/dashboard/charts/BookingSummaryChart';
import { PopularPackagesTable } from '@/components/dashboard/tables/PopularPackagesTable';
import { ExpiringPackagesTable } from '@/components/dashboard/tables/ExpiringPackagesTable';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const StatItem = ({
    icon,
    label,
    value,
    iconBg,
    iconColor,
    layout = 'vertical'
}: {
    icon: React.ReactNode,
    label: string,
    value: string | number,
    iconBg?: string,
    iconColor?: string,
    layout?: 'vertical' | 'horizontal'
}) => {

    if (layout === 'horizontal') {
        return (
             <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", iconBg)}>
                    {React.cloneElement(icon as React.ReactElement, { className: cn('h-5 w-5', iconColor) })}
                </div>
                <div>
                    <div className="text-xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", iconBg)}>
                {React.cloneElement(icon as React.ReactElement, { className: cn('h-5 w-5', iconColor) })}
            </div>
            <div>
                <div className="text-xl font-bold">{value}</div>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </div>
    );
};


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
            { label: 'Sales', value: formatCurrency(totalSales), icon: <DollarSign />, iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
            { label: 'Received', value: formatCurrency(totalReceived), icon: <TrendingUp />, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
            { label: 'Pending', value: formatCurrency(Math.max(0, totalPending)), icon: <CalendarX />, iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-500' }
          ],
          customerSummary: [
            { label: 'Booked Customers', value: bookedCustomers, icon: <UserCheck />, iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
            { label: 'Unbooked Customers', value: unbookedCustomers, icon: <UserX />, iconBg: 'bg-red-500/10', iconColor: 'text-red-500' }
          ],
          packageOverview: [
            { label: 'Tours', value: packages.length, icon: <Package />, iconBg: 'bg-sky-500/10', iconColor: 'text-sky-500' },
            { label: 'Tripdays', value: tripDays.length, icon: <Calendar />, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
            { label: 'Operators', value: operators.length, icon: <UserCog />, iconBg: 'bg-red-500/10', iconColor: 'text-red-500' },
            { label: 'Customers', value: profiles.length, icon: <Users />, iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
            { label: 'Locations', value: locations.length, icon: <MapPin />, iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-500' }
          ],
          operatorSummary: [
            { label: 'Referred Operator', value: referredOperators, icon: <UserPlus />, iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
            { label: 'Unreferred Operator', value: unReferredOperators, icon: <User />, iconBg: 'bg-red-500/10', iconColor: 'text-red-500' }
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
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-80 rounded-lg" />
                <Skeleton className="h-80 rounded-lg" />
            </div>
        </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
                <CardTitle>Bookings Overview</CardTitle>
                <CardDescription>An overview of your sales and revenue.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.bookingOverview.map((stat:any) => <StatItem key={stat.label} {...stat} layout="horizontal" />)}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>Customer Summary</CardTitle>
                <CardDescription>A summary of your customer base.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stats.customerSummary.map((stat:any) => <StatItem key={stat.label} {...stat} layout="horizontal" />)}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Packages Overview</CardTitle>
                <CardDescription>A high-level view of your tour assets.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-4">
                  {stats.packageOverview.map((stat:any) => <StatItem key={stat.label} {...stat} />)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operator Summary</CardTitle>
                <CardDescription>A summary of your tour operators.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {stats.operatorSummary.map((stat:any) => <StatItem key={stat.label} {...stat} layout="horizontal" />)}
              </CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <BookingCancellationChart data={chartData.lineChartData} />
             <BookingSummaryChart data={chartData.curveChartData} />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PopularPackagesTable data={tableData.popularPackages} />
            <ExpiringPackagesTable data={tableData.expiringPackages} />
        </div>
    </div>
  );
}

    