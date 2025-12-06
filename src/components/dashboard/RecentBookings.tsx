import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import mockData from '@/lib/data';
import { formatCurrency, getStatusBadgeColor } from '@/lib/utils';
import type { Booking } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';

export function RecentBookings() {
  const recentBookings = [...mockData.bookings]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>A list of the most recent bookings from your store.</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/bookings">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBookings.map((booking: Booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${booking.userId}`} alt="Avatar" />
                      <AvatarFallback>{booking.customerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                            {booking.customerEmail}
                        </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={getStatusBadgeColor(booking.status)} variant="outline">
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {booking.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(booking.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
