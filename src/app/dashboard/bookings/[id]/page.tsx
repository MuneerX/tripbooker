
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Calendar, Users, Clock, Info, Star, CheckCircle, XCircle, ArrowUpRight, Sun, Moon, CreditCard, User, Phone, MapPinIcon, Hash, FileDown, Plus } from "lucide-react";
import { formatCurrency, getStatusBadgeColor, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBookingById } from "@/lib/supabase/queries";
import type { Booking, TripDay } from "@/lib/types";
import { useBreadcrumb } from "../../layout";

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { setBreadcrumbName } = useBreadcrumb();

  const [booking, setBooking] = React.useState<Booking | null>(null);

  React.useEffect(() => {
    if (id) {
      const fetchBooking = async () => {
        const data = await getBookingById(id);
        setBooking(data);
        if (data) {
          setBreadcrumbName(`Booking #${data.booking_reference}`);
        } else {
          setBreadcrumbName('Booking Not Found');
        }
      };
      fetchBooking();
    }
    return () => setBreadcrumbName('');
  }, [id, setBreadcrumbName]);

  const tourPackage = booking?.tour_package;

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
  
  if (!booking || !tourPackage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Loading Booking Details...</h1>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  const detailItems = [
    { icon: <Clock />, label: "Duration", value: `${tourPackage.days} Days / ${tourPackage.nights} Nights` },
    { icon: <Users />, label: "Max Guests", value: tourPackage.max_guests },
  ];

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                    {tourPackage.name}
                </h1>
                <p className="text-sm text-muted-foreground">Booking Ref: {booking.booking_reference}</p>
            </div>
            <Image
                alt={tourPackage.name}
                className="aspect-video rounded-md object-cover"
                height={64}
                src={tourPackage.featured_image_url || "https://picsum.photos/seed/placeholder/200/100"}
                width={128}
            />
            <div className="ml-auto flex items-center gap-2">
                <Button variant="destructive" size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Cancel Booking
                </Button>
                <Button size="sm" variant="default">
                    <Check className="mr-2 h-4 w-4" />
                    Accept Reservation
                </Button>
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
                        {/* General Information */}
                        <Card>
                            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Created On</p><p className="font-medium">{format(new Date(booking.created_at), "PPP")}</p></div></div>
                                <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Reservation Date</p><p className="font-medium">{format(new Date(booking.booking_date), "PPP")}</p></div></div>
                                <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Travel Date</p><p className="font-medium">{booking.travel_date ? format(new Date(booking.travel_date), "PPP") : 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><Users className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">No. of Guests</p><p className="font-medium">{booking.total_adults} Adult(s), {booking.total_children} Child(ren)</p></div></div>
                                <div className="flex items-start gap-3"><Hash className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Referral Code</p><p className="font-medium">{booking.referral_code || 'N/A'}</p></div></div>
                            </CardContent>
                        </Card>
                        {/* Customer Details */}
                        <Card>
                            <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-3"><User className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Customer Name</p><p className="font-medium">{booking.customer.full_name}</p></div></div>
                                <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Contact Number</p><p className="font-medium">{booking.customer.address?.phone_number || 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><MapPinIcon className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">City</p><p className="font-medium">{booking.customer.address?.city || 'N/A'}</p></div></div>
                                <div className="flex items-start gap-3"><Hash className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Pincode</p><p className="font-medium">{booking.customer.address?.pincode || 'N/A'}</p></div></div>
                            </CardContent>
                        </Card>
                         {/* Payment Overview */}
                        <Card>
                            <CardHeader><CardTitle>Payment Overview</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-3"><CreditCard className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Base Price</p><p className="font-medium">{formatCurrency(tourPackage.base_price)}</p></div></div>
                                <div className="flex items-start gap-3"><CreditCard className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Pay In Parts</p><p className="font-medium">{tourPackage.pay_in_parts?.length > 0 ? 'Multiple Time' : 'One Time'}</p></div></div>
                                <div className="flex items-start gap-3"><CreditCard className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Payment Status</p><p className="font-medium capitalize">{booking.payment_status}</p></div></div>
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
                                    <h3 className="text-xl font-semibold mb-4">Itinerary</h3>
                                    <div className="space-y-6">
                                        {tourPackage.trip_days.sort((a,b) => a.day_number - b.day_number).map((day: TripDay) => (
                                            <Card key={day.id}>
                                              <CardHeader><CardTitle>Day {day.day_number}: {day.day_name}</CardTitle></CardHeader>
                                              <CardContent>
                                                <p className="text-muted-foreground mb-4">{day.description}</p>
                                                {day.activities.map((activity, actIndex) => (
                                                  <div key={actIndex} className="flex items-start gap-4 p-3 border-b last:border-b-0">
                                                    <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                                                    <div>
                                                      <p className="font-semibold">{activity.title}</p>
                                                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </CardContent>
                                            </Card>
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
                                    <div>
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
                                        {/* This is a placeholder as guest details are not in the schema */}
                                        <TableRow>
                                            <TableCell>John</TableCell>
                                            <TableCell>Doe</TableCell>
                                            <TableCell>34</TableCell>
                                            <TableCell>Male</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Jane</TableCell>
                                            <TableCell>Doe</TableCell>
                                            <TableCell>32</TableCell>
                                            <TableCell>Female</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">Guest data structure not defined. This is mock data.</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payment" className="space-y-8">
                         <Card>
                            <CardHeader><CardTitle>Payment Timeline</CardTitle></CardHeader>
                            <CardContent>
                                {/* This is a placeholder for vertical timeline */}
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>Payment timeline visualization coming soon.</p>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Due On</TableHead><TableHead>Paid On</TableHead><TableHead>Mode</TableHead><TableHead>Amount</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {/* This is a placeholder as payment details are not in the schema */}
                                        <TableRow>
                                            <TableCell>pay_123</TableCell>
                                            <TableCell>{format(new Date(), "PPP")}</TableCell>
                                            <TableCell>{format(new Date(), "PPP")}</TableCell>
                                            <TableCell>Credit Card</TableCell>
                                            <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                                            <TableCell><Button variant="outline" size="sm"><FileDown className="mr-2 h-4 w-4" /> Invoice</Button></TableCell>
                                        </TableRow>
                                         <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">Payment data structure not defined. This is mock data.</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
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
    </div>
  );
}
