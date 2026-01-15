

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Calendar, Users, Clock, Info, Star, CheckCircle, XCircle, ArrowUpRight, Sun, Moon, CreditCard, User, Phone, MapPinIcon, Hash, FileDown, Plus, ChevronDown } from "lucide-react";
import { formatCurrency, getStatusBadgeColor, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { addMonths, format, isBefore, isAfter, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBookingById, acceptBooking, cancelBooking } from "@/lib/supabase/queries";
import type { Booking, BookingGuest, TripDay, Payment, UserPipSchedule } from "@/lib/types";
import { useBreadcrumb } from "../../layout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


type TimelineStatus = 'paid' | 'overdue-paid' | 'overdue' | 'next-pay' | 'locked';

const getTimelineStatusInfo = (status: TimelineStatus) => {
    switch (status) {
        case 'paid': return { text: 'Paid', className: 'bg-green-500', icon: <Check className="h-4 w-4" /> };
        case 'overdue-paid': return { text: 'Overdue Paid', className: 'bg-yellow-500', icon: <Check className="h-4 w-4" /> };
        case 'overdue': return { text: 'Overdue', className: 'bg-red-500', icon: <X className="h-4 w-4" /> };
        case 'next-pay': return { text: 'Next Pay', className: 'bg-blue-500', icon: <Clock className="h-4 w-4" /> };
        case 'locked':
        default: return { text: 'Locked', className: 'bg-gray-400', icon: <Clock className="h-4 w-4" /> };
    }
}


export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { setBreadcrumbName } = useBreadcrumb();
  const { toast } = useToast();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [openDays, setOpenDays] = React.useState<Record<string, boolean>>({});
  const [actionToConfirm, setActionToConfirm] = React.useState<'accept' | 'cancel' | null>(null);
  
  const fetchBooking = React.useCallback(async () => {
    if (id) {
      const data = await getBookingById(id);
      setBooking(data);
      if (data) {
        setBreadcrumbName(`Booking #${data.order_id}`);
      } else {
        setBreadcrumbName('Booking Not Found');
      }
    }
  }, [id, setBreadcrumbName]);

  React.useEffect(() => {
    fetchBooking();
    return () => setBreadcrumbName('');
  }, [fetchBooking, setBreadcrumbName]);


  const handleShowAllDays = () => {
    if (!booking?.tour_package?.trip_days) return;
    const allOpen = Object.values(openDays).every(Boolean);
    const newOpenDays: Record<string, boolean> = {};
    booking.tour_package.trip_days.forEach(day => {
      newOpenDays[day.id] = !allOpen;
    });
    setOpenDays(newOpenDays);
  };

  const allDaysInitiallyOpen = Object.values(openDays).every(Boolean);

  const handleActionConfirm = async () => {
    if (!actionToConfirm || !booking) return;

    try {
      if (actionToConfirm === 'accept') {
        await acceptBooking(booking.id);
        toast({ title: "Success", description: "Booking has been confirmed." });
      } else {
        await cancelBooking(booking.id);
        toast({ title: "Success", description: "Booking has been cancelled." });
      }
      fetchBooking(); // Refresh data
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${actionToConfirm} booking.`,
      });
    } finally {
      setActionToConfirm(null);
    }
  };

    
  const paymentTimeline = React.useMemo(() => {
    if (!booking || !booking.user_pip_schedules || booking.user_pip_schedules.length === 0) {
        return [];
    }
    
    const schedule = booking.user_pip_schedules.map((part) => {
        const dueDate = parseISO(part.due_date);
        const paidDate = part.paid_date ? parseISO(part.paid_date) : null;
        let status: TimelineStatus = 'locked';
        const today = new Date();

        if (part.is_paid) {
            status = paidDate && isAfter(paidDate, dueDate) ? 'overdue-paid' : 'paid';
        } else if (isAfter(today, dueDate)) {
            status = 'overdue';
        }
        
        return {
            ...part,
            dueDate: dueDate,
            paidOn: paidDate,
            status: status, // initial status
        };
    });

    // Determine the 'next-pay' status
    const firstUnpaidIndex = schedule.findIndex(s => !s.is_paid);
    if(firstUnpaidIndex !== -1 && schedule[firstUnpaidIndex].status !== 'overdue') {
        schedule[firstUnpaidIndex].status = 'next-pay';
    }


    return schedule;
  }, [booking]);


  const paymentProgress = React.useMemo(() => {
    if (!booking || !booking.tour_package) {
        return {
            paidAmount: 0,
            pendingAmount: 0,
            totalScheduledAmount: 0,
            progressValue: 0,
            paidCount: 0,
            totalCount: 0,
            nextDueDate: null,
            paymentStatusText: 'Loading...',
            progressSegments: []
        };
    }
    
    const paidAmount = booking.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

    if (paymentTimeline.length === 0) {
        const totalAmount = booking.total_amount;
        const isPaid = paidAmount >= totalAmount && totalAmount > 0;
        const pendingAmount = Math.max(0, totalAmount - paidAmount);
        const progressValue = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0;
        
        return {
            paidAmount,
            pendingAmount,
            totalScheduledAmount: totalAmount,
            progressValue,
            paidCount: isPaid ? 1 : 0,
            totalCount: 1,
            nextDueDate: null,
            paymentStatusText: isPaid ? 'Fully Paid' : 'Full Payment Due',
            progressSegments: [{ color: isPaid ? 'bg-green-500' : 'bg-blue-500', width: `${progressValue}%` }]
        };
    }

    const totalScheduledAmount = paymentTimeline.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = Math.max(0, totalScheduledAmount - paidAmount);
    const progressValue = totalScheduledAmount > 0 ? Math.min((paidAmount / totalScheduledAmount) * 100, 100) : 0;
    
    const paidCount = paymentTimeline.filter(p => p.is_paid).length;
    const totalCount = paymentTimeline.length;
    const nextPayment = paymentTimeline.find(p => p.status === 'next-pay' || p.status === 'overdue');
    
    let paymentStatusText = 'All installments paid';
    if (nextPayment) {
        paymentStatusText = nextPayment.status === 'overdue' ? 'Payment is Overdue' : 'Next payment is due';
    } else if (paidCount < totalCount) {
        paymentStatusText = 'Payment processing';
    }

    const progressSegments = paymentTimeline.map(part => {
        const width = (part.amount / totalScheduledAmount) * 100;
        let color = 'bg-gray-300 dark:bg-gray-700'; // Locked
        if (part.status === 'paid') color = 'bg-green-500';
        if (part.status === 'overdue-paid') color = 'bg-yellow-500';
        if (part.status === 'overdue') color = 'bg-red-500';
        if (part.status === 'next-pay') color = 'bg-blue-500'; 
        return { color, width: `${width}%` };
    });

    return {
        paidAmount,
        pendingAmount,
        totalScheduledAmount,
        progressValue,
        paidCount,
        totalCount,
        nextDueDate: nextPayment?.dueDate || null,
        paymentStatusText,
        progressSegments
    }
  }, [paymentTimeline, booking]);


  if (!booking || !booking.tour_package) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Loading Booking Details...</h1>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }
  const tourPackage = booking.tour_package;
  
  const renderPointList = (text: string | null | undefined) => {
    if (!text) return <p className="text-sm text-muted-foreground leading-relaxed">N/A</p>;
    const points = text.split(/[\n,]+/).map(p => p.trim()).filter(p => p);
    return (
      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
        {points.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>
    );
  };

  const detailItems = [
    { icon: <Clock />, label: "Duration", value: `${tourPackage.days} Days / ${tourPackage.nights} Nights` },
    { icon: <Users />, label: "Max Guests", value: tourPackage.max_guests },
  ];
  
  const packageImage = tourPackage.featured_image_url || tourPackage.image_urls?.[0] || "https://picsum.photos/seed/placeholder/200/200";

  return (
    <div className="space-y-6">
       <AlertDialog open={!!actionToConfirm} onOpenChange={(open) => !open && setActionToConfirm(null)}>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0">
                <Image
                    src={packageImage}
                    alt={tourPackage.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="flex-1">
                <h1 className="text-xl font-semibold tracking-tight truncate">
                    {tourPackage.name}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Ref: {booking.order_id}</p>
                  <Badge className={cn("capitalize", getStatusBadgeColor(booking.booking_status))}>
                    {booking.booking_status}
                  </Badge>
                </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
                 {booking.booking_status === 'pending' && (
                    <>
                        <Button variant="destructive" size="sm" onClick={() => setActionToConfirm('cancel')}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel Booking
                        </Button>
                        <Button size="sm" variant="default" onClick={() => setActionToConfirm('accept')}>
                            <Check className="mr-2 h-4 w-4" />
                            Accept Reservation
                        </Button>
                    </>
                 )}
                 {booking.booking_status === 'confirmed' && (
                     <Button variant="destructive" size="sm" onClick={() => setActionToConfirm('cancel')}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel Booking
                    </Button>
                 )}
            </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
            <Card>
                <CardHeader className="p-4 border-b">
                    <TabsList className="grid w-full grid-cols-4 p-0 bg-transparent border-0 shadow-none">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="package">Package</TabsTrigger>
                        <TabsTrigger value="guests">Guest Details</TabsTrigger>
                        <TabsTrigger value="payment">Payment Details</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="p-6">
                    <TabsContent value="overview" className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* General Information */}
                            <Card>
                                <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Created On</p><p className="font-medium">{format(new Date(booking.created_at), "PPP")}</p></div></div>
                                    <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Reservation Date</p><p className="font-medium">{format(new Date(booking.booking_date), "PPP")}</p></div></div>
                                    <div className="flex items-start gap-3"><Hash className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Referral Code</p><p className="font-medium">{booking.referral_code || 'N/A'}</p></div></div>
                                    <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Travel Date</p><p className="font-medium">{booking.travel_date ? format(new Date(booking.travel_date), "PPP") : 'N/A'}</p></div></div>
                                    <div className="flex items-start gap-3"><Users className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">No. of Guests</p><p className="font-medium">{booking.total_adults} Adult(s), {booking.total_children} Child(ren)</p></div></div>
                                </CardContent>
                            </Card>
                            {/* Customer Details */}
                            <Card>
                                <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="flex items-start gap-3"><User className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Customer Name</p><p className="font-medium">{booking.customer.full_name}</p></div></div>
                                    <div className="flex items-start gap-3"><MapPinIcon className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">City</p><p className="font-medium">{booking.customer.address?.city || 'N/A'}</p></div></div>
                                    <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Contact Number</p><p className="font-medium">{booking.customer.address?.phone_number || 'N/A'}</p></div></div>
                                    <div className="flex items-start gap-3"><Hash className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Pincode</p><p className="font-medium">{booking.customer.address?.pincode || 'N/A'}</p></div></div>
                                </CardContent>
                            </Card>
                        </div>
                         {/* Payment Overview */}
                        <Card>
                            <CardHeader><CardTitle>Payment Overview</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                               <div className="space-y-2">
                                  <div className="flex justify-between items-center text-sm">
                                      <p className="text-muted-foreground">{paymentProgress.paymentStatusText}</p>
                                      {paymentProgress.nextDueDate && (
                                        <p>Next due: <span className="font-medium">{format(paymentProgress.nextDueDate, "PPP")}</span></p>
                                      )}
                                  </div>
                                   {paymentTimeline.length > 0 ? (
                                    <div className="relative pt-4">
                                        <div className="relative h-2 w-full rounded-full bg-muted">
                                            {/* Segmented bar */}
                                            <div className="flex h-full w-full">
                                              {paymentProgress.progressSegments.map((seg, index) => (
                                                <div key={index} className={cn("h-full", seg.color)} style={{ width: seg.width }} />
                                              ))}
                                            </div>
                                            
                                            {/* Timeline Stops */}
                                            <div className="absolute top-0 left-0 w-full h-full flex items-center">
                                              {paymentTimeline.map((part, index) => {
                                                  const cumulativeAmount = paymentTimeline.slice(0, index + 1).reduce((acc, p) => acc + p.amount, 0);
                                                  const position = (cumulativeAmount / paymentProgress.totalScheduledAmount) * 100;
                                                  const statusInfo = getTimelineStatusInfo(part.status);
                                                  return (
                                                      <div
                                                          key={part.id || index}
                                                          className="absolute top-1/2 -translate-y-1/2"
                                                          style={{ left: `${position}%` }}
                                                      >
                                                          <div
                                                            className={cn("h-6 w-6 -translate-x-1/2 rounded-full border-2 border-background flex items-center justify-center text-white z-10", statusInfo.className)}
                                                          >
                                                              {React.cloneElement(statusInfo.icon, { className: 'h-3.5 w-3.5' })}
                                                          </div>
                                                      </div>
                                                  )
                                              })}
                                            </div>
                                        </div>
                                         <p className="text-sm text-muted-foreground text-center pt-4">
                                            {paymentProgress.paidCount} out of {paymentProgress.totalCount} installments paid
                                          </p>
                                    </div>
                                   ) : (
                                    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${paymentProgress.progressValue}%` }}/>
                                    </div>
                                   )}
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Paid</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(paymentProgress.paidAmount)}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Total Pending</p>
                                    <p className="text-lg font-bold text-destructive">{formatCurrency(paymentProgress.pendingAmount)}</p>
                                  </div>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="package">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Details */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">{tourPackage.name}</h2>
                                    <p className="text-muted-foreground">{tourPackage.description}</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><Plus className="text-blue-500"/> Highlights</h3>
                                        {renderPointList(tourPackage.highlights)}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><Check className="text-green-500"/> Inclusions</h3>
                                        {renderPointList(tourPackage.inclusion)}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><X className="text-red-500"/> Exclusions</h3>
                                        {renderPointList(tourPackage.exclusion)}
                                    </div>
                                </div>
                                
                                <Separator className="my-8" />
                                
                                {tourPackage.trip_days && tourPackage.trip_days.length > 0 && (
                                  <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Itinerary</h3>
                                        <Button variant="outline" size="sm" onClick={handleShowAllDays}>
                                            {allDaysInitiallyOpen ? "Show Less" : "Show All Days"}
                                        </Button>
                                    </div>
                                    <div className="space-y-6">
                                        {tourPackage.trip_days.sort((a,b) => a.day_number - b.day_number).map((day: TripDay) => (
                                            <Collapsible 
                                              asChild 
                                              key={day.id} 
                                              open={openDays[day.id] || false}
                                              onOpenChange={(isOpen) => setOpenDays(prev => ({...prev, [day.id]: isOpen}))}
                                            >
                                                <Card>
                                                    <CollapsibleTrigger asChild>
                                                        <div className="flex items-center justify-between cursor-pointer p-6">
                                                            <CardTitle className="text-lg">Day {day.day_number}: {day.day_name}</CardTitle>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
                                                            </Button>
                                                        </div>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <CardContent>
                                                            <p className="text-muted-foreground mb-4">{day.description}</p>
                                                            {day.activities.map((activity, actIndex) => (
                                                              <div key={actIndex} className="flex items-start gap-4 p-3 border-b last:border-b-0">
                                                                <div className="flex-shrink-0 pt-1">
                                                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                  <p className="font-semibold">{activity.title}</p>
                                                                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                                                                </div>
                                                              </div>
                                                            ))}
                                                        </CardContent>
                                                    </CollapsibleContent>
                                                </Card>
                                            </Collapsible>
                                        ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                            
                            {/* Right Column: Pricing & Info */}
                            <div className="space-y-6">
                                <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-muted-foreground">Base Price</span>
                                        <span className="text-3xl font-bold text-primary">{formatCurrency(tourPackage.base_price)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {detailItems.map(item => (
                                            <div key={item.label} className="flex items-center gap-3">
                                                <div className="text-muted-foreground">{item.icon}</div>
                                                <div>
                                                    <p className="font-medium text-muted-foreground">{item.label}</p>
                                                    <p>{String(item.value)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {tourPackage.pay_in_parts && tourPackage.pay_in_parts.length > 0 && (
                                    <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-4">
                                        <h3 className="font-semibold mb-2">Pay in Parts Plans</h3>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Months</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {tourPackage.pay_in_parts.map((part, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{part.plan_name}</TableCell>
                                                        <TableCell>{part.months}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(part.total_amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="guests">
                        <Card>
                            <CardHeader><CardTitle>Guest Details</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>First Name</TableHead><TableHead>Last Name</TableHead><TableHead>Age</TableHead><TableHead>Gender</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {booking.guests && booking.guests.length > 0 ? (
                                            booking.guests.map((guest: BookingGuest) => (
                                                <TableRow key={guest.id}>
                                                    <TableCell>{guest.first_name}</TableCell>
                                                    <TableCell>{guest.last_name || 'N/A'}</TableCell>
                                                    <TableCell>{guest.age || 'N/A'}</TableCell>
                                                    <TableCell className="capitalize">{guest.gender || 'N/A'}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground">No guest details provided for this booking.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payment" className="space-y-8">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader><CardTitle>Payment Timeline</CardTitle></CardHeader>
                                <CardContent>
                                    {paymentTimeline.length > 0 ? (
                                        <div className="relative space-y-8">
                                            <div className="absolute left-2.5 top-0 h-full w-px bg-border" />
                                            {paymentTimeline.map((item, index) => {
                                                const statusInfo = getTimelineStatusInfo(item.status);
                                                return (
                                                    <div key={item.id || index} className="flex gap-4 pl-4">
                                                         <div className="relative h-full">
                                                            <div className={cn("absolute top-1 -left-[22px] h-8 w-8 rounded-full flex items-center justify-center text-white z-10", statusInfo.className)}>
                                                                {statusInfo.icon}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 pb-8 pl-6">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-semibold">Installment {item.installment_number}</p>
                                                                    <Badge variant="secondary" className="mt-1">{statusInfo.text}</Badge>
                                                                </div>
                                                                <p className="font-semibold text-lg">{formatCurrency(item.amount)}</p>
                                                            </div>
                                                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                                <div>
                                                                    <p>Due Date:</p>
                                                                    <p className="font-medium text-foreground">{format(item.dueDate, "PPP")}</p>
                                                                </div>
                                                                <div>
                                                                    <p>Paid On:</p>
                                                                    <p className="font-medium text-foreground">{item.paidOn ? format(item.paidOn, "PPP") : 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <p>No installment plan is set for this booking.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Payment Records</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    {booking.payments && booking.payments.length > 0 ? (
                                        booking.payments.map((payment: Payment) => (
                                            <React.Fragment key={payment.id}>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                                    <div className="flex items-start gap-3">
                                                        <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Transaction ID</p>
                                                            <p className="font-medium font-mono text-xs">{payment.transaction_id || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Amount</p>
                                                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Paid On</p>
                                                            <p className="font-medium">{payment.created_at ? format(new Date(payment.created_at), "PPP") : 'NA'}</p>
                                                        </div>
                                                    </div>
                                                     <div className="flex items-start gap-3">
                                                        <Info className="h-5 w-5 text-muted-foreground mt-1" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Payment Mode</p>
                                                            <p className="font-medium capitalize">{payment.payment_method || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                 <div className="mt-4">
                                                    <Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" /> Download Invoice</Button>
                                                 </div>
                                                 {booking.payments.length > 1 && <Separator className="my-6" />}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <p>No payment records found for this booking.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                         </div>
                         <Card>
                            <CardHeader><CardTitle>Overall Payment Summary</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="flex justify-between"><span className="text-muted-foreground">Package Amount</span><span>{formatCurrency(tourPackage.base_price)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span>{formatCurrency(0)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Conveyance Fee</span><span>{formatCurrency(0)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Payment Gateway Fee</span><span>{formatCurrency(0)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{formatCurrency(0)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Deduction</span><span>- {formatCurrency(0)}</span></div>
                                <Separator className="col-span-2" />
                                <div className="flex justify-between font-bold"><span >Total Amount Paid</span><span>{formatCurrency(booking.total_amount)}</span></div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will {actionToConfirm === 'accept' ? 'confirm' : 'cancel'} the booking with reference "{booking.order_id}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setActionToConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleActionConfirm} className={cn(actionToConfirm === 'cancel' && "bg-destructive hover:bg-destructive/90")}>
                {actionToConfirm === 'accept' ? 'Accept' : 'Confirm Cancellation'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    

    