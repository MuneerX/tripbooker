
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check, X, ArrowRight, User, Package, Calendar, Info } from "lucide-react";
import type { Booking } from "@/lib/types";
import { getPendingBookings, acceptBooking, cancelBooking } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedNotification, setSelectedNotification] = React.useState<Booking | null>(null);

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const pendingBookings = await getPendingBookings();
      setNotifications(pendingBookings);
      if (pendingBookings.length > 0) {
        setSelectedNotification(pendingBookings[0]);
      } else {
        setSelectedNotification(null);
      }
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

  const handleAction = async (action: 'accept' | 'cancel', bookingId: string) => {
    try {
      if (action === 'accept') {
        await acceptBooking(bookingId);
        toast({ title: "Success", description: "Booking has been confirmed." });
      } else {
        await cancelBooking(bookingId);
        toast({ title: "Success", description: "Booking has been cancelled." });
      }
      fetchNotifications(); // Refresh list
      router.refresh(); // Refresh server components if any
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${action} booking.`,
      });
    }
  };

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
             <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
       {loading ? (
             renderSkeleton()
        ) : notifications.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Notification List */}
                <div className="lg:col-span-1 space-y-4">
                     <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>A new reservation is awaiting approval.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
                            {notifications.map((booking) => (
                                <button
                                    key={booking.id}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg border transition-colors",
                                        selectedNotification?.id === booking.id
                                        ? "bg-muted border-primary"
                                        : "hover:bg-muted/50"
                                    )}
                                    onClick={() => setSelectedNotification(booking)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={booking.avatar_url || ''} alt={booking.customer_name} />
                                            <AvatarFallback>{booking.customer_name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-0.5">
                                            <p className="font-semibold text-sm line-clamp-1">New booking created</p>
                                            <p className="text-xs text-muted-foreground">For {booking.tour_package?.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                {/* Right Column: Detailed View */}
                <div className="lg:col-span-2">
                    {selectedNotification ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Notification Details</CardTitle>
                                        <CardDescription>
                                            For tour: <Link href={`/dashboard/tour-packages/${selectedNotification.package_id}`} className="text-primary hover:underline">{selectedNotification.tour_package?.name}</Link>
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/bookings/${selectedNotification.id}`}>
                                            View Full Booking <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Customer</p>
                                            <Link href={`/dashboard/customers/${selectedNotification.user_id}`} className="font-medium hover:underline">
                                                {selectedNotification.customer_name}
                                            </Link>
                                        </div>
                                    </div>
                                     <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Reservation Date</p>
                                            <p className="font-medium">{format(new Date(selectedNotification.booking_date), "PPP")}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Booking ID</p>
                                            <p className="font-medium font-mono text-xs">{selectedNotification.booking_reference}</p>
                                        </div>
                                    </div>
                                     <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Created At</p>
                                            <p className="font-medium">{formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex w-full items-center gap-2 pt-4 border-t">
                                  <Button variant="outline" size="lg" className="flex-1" onClick={() => handleAction('cancel', selectedNotification.id)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                                  <Button size="lg" className="flex-1" onClick={() => handleAction('accept', selectedNotification.id)}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                         <div className="text-center py-24 text-muted-foreground h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed">
                            <Bell className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-semibold">Select a notification</h3>
                            <p className="mt-2 text-sm">Choose a notification from the left to see its details.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="text-center py-24 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
              <p className="mt-2 text-sm">There are no new notifications.</p>
            </div>
        )}
    </div>
  );
}
