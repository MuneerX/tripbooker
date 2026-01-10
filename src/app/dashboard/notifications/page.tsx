
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, X, ArrowRight, User, Package } from "lucide-react";
import type { Booking } from "@/lib/types";
import { getPendingBookings, acceptBooking, cancelBooking } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const pendingBookings = await getPendingBookings();
      setNotifications(pendingBookings);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch notifications.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleAccept = async (bookingId: string) => {
    try {
      await acceptBooking(bookingId);
      toast({
        title: "Success",
        description: "Booking has been confirmed.",
      });
      // Refresh the list of notifications
      fetchNotifications();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to confirm booking.",
      });
    }
  };
  
  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast({
        title: "Success",
        description: "Booking has been cancelled.",
      });
      // Refresh the list of notifications
      fetchNotifications();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel booking.",
      });
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardContent className="p-6 flex items-center gap-6">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Review and respond to pending bookings that require your attention.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             renderSkeleton()
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12 border">
                         <AvatarImage src={booking.avatar_url || ''} alt={booking.customer_name} />
                        <AvatarFallback>{booking.customer_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <p className="font-semibold">
                          New booking for <Link href={`/dashboard/tour-packages/${booking.package_id}`} className="text-primary hover:underline">{booking.tour_package?.name}</Link>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          From <Link href={`/dashboard/customers/${booking.user_id}`} className="font-medium text-foreground hover:underline">{booking.customer_name}</Link> - {format(new Date(booking.booking_date), "PPP")}
                        </p>
                         <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleCancel(booking.id)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                      <Button size="sm" onClick={() => handleAccept(booking.id)}><Check className="mr-2 h-4 w-4" /> Accept</Button>
                      <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/bookings/${booking.id}`}>
                              View <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="mt-2 text-sm">There are no new notifications.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
