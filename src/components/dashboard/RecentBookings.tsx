
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getStatusBadgeColor } from '@/lib/utils';
import type { Booking } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export function RecentBookings({ bookings }: { bookings: Booking[] }) {
  const recentBookings = bookings.slice(0, 5);

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
            {recentBookings.length > 0 ? (
              recentBookings.map((booking: Booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${booking.user_id}`} alt="Avatar" />
                      <AvatarFallback>{booking.customer_name?.charAt(0) ?? 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5">
                        <div className="font-medium">{booking.customer_name}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                            {booking.customer_email}
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
                  {format(new Date(booking.created_at), "PPP")}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(booking.total_amount)}</TableCell>
              </TableRow>
            ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No recent bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
