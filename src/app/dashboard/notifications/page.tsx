"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, X, ArrowRight, User, Package, Calendar, Info, Star, UserCog, UserPlus } from "lucide-react";
import type { Booking, Review, Operator } from "@/lib/types";
import { getPendingBookings, acceptBooking, cancelBooking, getPendingReviews, updateReviewStatus, getRecentOperators } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'bookings';
  
  const { toast } = useToast();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [agents, setAgents] = React.useState<Operator[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [selectedItem, setSelectedItem] = React.useState<{type: 'booking' | 'review' | 'agent', data: any} | null>(null);

  const fetchAllNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pendingBookings, pendingReviews, newAgents] = await Promise.all([
        getPendingBookings(),
        getPendingReviews(),
        getRecentOperators()
      ]);
      
      setBookings(pendingBookings);
      setReviews(pendingReviews);
      setAgents(newAgents);

      // Set initial selection based on tab
      if (initialTab === 'bookings' && pendingBookings.length > 0) {
        setSelectedItem({ type: 'booking', data: pendingBookings[0] });
      } else if (initialTab === 'reviews' && pendingReviews.length > 0) {
        setSelectedItem({ type: 'review', data: pendingReviews[0] });
      } else if (initialTab === 'agents' && newAgents.length > 0) {
        setSelectedItem({ type: 'agent', data: newAgents[0] });
      } else {
        setSelectedItem(null);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch notifications." });
    } finally {
      setLoading(false);
    }
  }, [toast, initialTab]);

  React.useEffect(() => {
    fetchAllNotifications();
  }, [fetchAllNotifications]);

  const handleBookingAction = async (action: 'accept' | 'cancel', bookingId: string) => {
    try {
      if (action === 'accept') {
        await acceptBooking(bookingId);
        toast({ title: "Success", description: "Booking has been confirmed." });
      } else {
        await cancelBooking(bookingId, "Manager decision");
        toast({ title: "Success", description: "Booking has been cancelled." });
      }
      fetchAllNotifications();
      router.refresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleReviewAction = async (action: 'approved' | 'rejected', reviewId: string) => {
    try {
      await updateReviewStatus(reviewId, action);
      toast({ title: "Success", description: `Review has been ${action === 'approved' ? 'published' : 'removed'}.` });
      fetchAllNotifications();
      router.refresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const renderSidebarItem = (type: 'booking' | 'review' | 'agent', data: any) => {
    const isSelected = selectedItem?.type === type && selectedItem?.data.id === data.id;
    
    let title = "";
    let sub = "";
    let avatar = undefined;
    let initial = "U";

    if (type === 'booking') {
        title = "New Booking Request";
        sub = `${data.customer_name} booked ${data.tour_package?.name}`;
        avatar = data.avatar_url || undefined;
        initial = data.customer_name?.charAt(0) || 'B';
    } else if (type === 'review') {
        title = "New Review Received";
        sub = `${data.customer_name} rated ${data.rating} stars`;
        avatar = data.avatar_url || undefined;
        initial = data.customer_name?.charAt(0) || 'R';
    } else if (type === 'agent') {
        title = "Agent Registration";
        sub = `${data.name} just signed up`;
        avatar = data.logo_url || undefined;
        initial = data.name?.charAt(0) || 'A';
    }

    return (
        <button
            key={data.id}
            className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors mb-2",
                isSelected ? "bg-muted border-primary" : "hover:bg-muted/50"
            )}
            onClick={() => setSelectedItem({ type, data })}
        >
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5 min-w-0">
                    <p className="font-semibold text-sm truncate">{title}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(data.created_at), { addSuffix: true })}
                    </p>
                </div>
            </div>
        </button>
    );
  };

  const renderDetailView = () => {
    if (!selectedItem) return (
        <div className="text-center py-24 text-muted-foreground h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Bell className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Select an alert</h3>
            <p className="mt-2 text-sm">Choose an item from the left to see its details.</p>
        </div>
    );

    const { type, data } = selectedItem;

    if (type === 'booking') {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="grid gap-1">
                            <CardTitle className="text-lg">Booking Reservation Request</CardTitle>
                            <CardDescription>Order ID: <span className="font-mono">{data.order_id}</span></CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/bookings/${data.id}`}>
                                Full Booking <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DetailField icon={User} label="Customer" value={data.customer_name} />
                        <DetailField icon={Package} label="Package" value={data.tour_package?.name} />
                        <DetailField icon={Calendar} label="Reservation Date" value={format(new Date(data.booking_date), "PPP")} />
                        <DetailField icon={Info} label="Status" value={data.booking_status} badge />
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" className="flex-1" onClick={() => handleBookingAction('cancel', data.id)}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                        <Button className="flex-1" onClick={() => handleBookingAction('accept', data.id)}><Check className="mr-2 h-4 w-4" /> Approve</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (type === 'review') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Review Moderation</CardTitle>
                    <CardDescription>A new rating has been submitted for <Link href={`/dashboard/tour-packages/${data.package_id}`} className="text-primary hover:underline">{data.tour_package?.name}</Link></CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={data.avatar_url || undefined} />
                            <AvatarFallback>{data.customer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{data.customer_name}</p>
                            <div className="flex gap-0.5 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={cn("h-4 w-4", i < data.rating ? "fill-current" : "text-muted")} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-muted/20 p-4 rounded-lg border italic">
                        "{data.comment || 'No comment provided.'}"
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                        <Button variant="outline" className="flex-1 text-destructive" onClick={() => handleReviewAction('rejected', data.id)}><X className="mr-2 h-4 w-4" /> Reject</Button>
                        <Button className="flex-1" onClick={() => handleReviewAction('approved', data.id)}><Check className="mr-2 h-4 w-4" /> Publish Review</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (type === 'agent') {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="grid gap-1">
                            <CardTitle className="text-lg">New Agent Registered</CardTitle>
                            <CardDescription>A new operator has created an account.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/operators/${data.id}`}>
                                View Profile <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DetailField icon={UserCog} label="Agent Name" value={data.name} />
                        <DetailField icon={Info} label="Agent Code" value={data.code || 'N/A'} />
                        <DetailField icon={Calendar} label="Registered" value={format(new Date(data.created_at), "PPP")} />
                        <DetailField icon={UserPlus} label="Referral Code" value={data.referral_code || 'None'} />
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>Verify the agent's identity and documentation before marking them as a verified operator.</p>
                    </div>
                    <Button className="w-full" asChild>
                        <Link href={`/dashboard/operators/edit/${data.id}`}>Go to Verification</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
       {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4"><Skeleton className="h-[400px] w-full" /></div>
                <div className="md:col-span-2"><Skeleton className="h-[400px] w-full" /></div>
             </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <Tabs defaultValue={initialTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="bookings">Bookings</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            <TabsTrigger value="agents">Agents</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="bookings" className="mt-0">
                            {bookings.length > 0 ? bookings.map(b => renderSidebarItem('booking', b)) : <EmptyState text="No pending bookings" />}
                        </TabsContent>
                        
                        <TabsContent value="reviews" className="mt-0">
                            {reviews.length > 0 ? reviews.map(r => renderSidebarItem('review', r)) : <EmptyState text="No reviews to moderate" />}
                        </TabsContent>
                        
                        <TabsContent value="agents" className="mt-0">
                            {agents.length > 0 ? agents.map(a => renderSidebarItem('agent', a)) : <EmptyState text="No recent registrations" />}
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="lg:col-span-2">
                    {renderDetailView()}
                </div>
            </div>
        )}
    </div>
  );
}

function DetailField({ icon: Icon, label, value, badge }: { icon: any, label: string, value: string, badge?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {badge ? (
                    <Badge variant="outline" className="capitalize mt-1">{value}</Badge>
                ) : (
                    <p className="font-medium">{value}</p>
                )}
            </div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
            <Bell className="mx-auto h-8 w-8 opacity-20" />
            <p className="mt-2 text-xs font-medium uppercase tracking-wider">{text}</p>
        </div>
    );
}

export default function NotificationsPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading notifications...</p></div>}>
      <NotificationsContent />
    </React.Suspense>
  );
}
