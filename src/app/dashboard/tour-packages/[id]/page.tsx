
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Calendar, Users, Clock, Check, X, Plus, Info, Star, CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import { formatCurrency, getStatusBadgeColor, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getTourPackageById } from "@/lib/supabase/queries";
import type { TourPackage, Booking, TripDay, Review } from "@/lib/types";
import mockData from "@/lib/data"; // Still needed for related data like bookings, reviews etc.

export default function TourPackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [tourPackage, setTourPackage] = React.useState<TourPackage | null>(null);
  const [status, setStatus] = React.useState<boolean | undefined>();
  
  // NOTE: Related data is still coming from mock data.
  // This would need to be fetched from Supabase as well in a real application.
  const [bookingsForPackage, setBookingsForPackage] = React.useState<Booking[]>([]);
  const [tripDaysForPackage, setTripDaysForPackage] = React.useState<TripDay[]>([]);
  const [reviewsForPackage, setReviewsForPackage] = React.useState<Review[]>([]);

  React.useEffect(() => {
    if (id) {
      const fetchPackage = async () => {
        const pkg = await getTourPackageById(id);
        setTourPackage(pkg);
        if (pkg) {
          setStatus(pkg.is_active);
          // Filter related mock data
          setBookingsForPackage(mockData.bookings.filter(b => b.tourPackageId === pkg.id));
          setTripDaysForPackage(mockData.tripDays.filter(d => d.tourPackageId === pkg.id));
          setReviewsForPackage(mockData.reviews.filter(r => r.tourPackageId === pkg.id));
        }
      };
      fetchPackage();
    }
  }, [id]);

  if (!tourPackage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Loading Tour Package...</h1>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  const handleStatusChange = (newStatus: boolean) => {
    // In a real app, you would call a function to update this in Supabase
    setStatus(newStatus);
    console.log(`TODO: Update package ${tourPackage.id} status to ${newStatus}`);
  };

  const detailItems = [
    { icon: <Clock />, label: "Duration", value: `${tourPackage.days} Days / ${tourPackage.nights} Nights` },
    { icon: <Users />, label: "Maximum Permitted Booking", value: tourPackage.max_guests },
    { icon: <Calendar />, label: "Introduced", value: format(new Date(tourPackage.created_at), "PPP") },
    { icon: <Calendar />, label: "Withdrawal Date", value: tourPackage.withdrawalDate ? format(new Date(tourPackage.withdrawalDate), "PPP") : 'N/A' },
    { icon: <Check className="text-green-500" />, label: "Featured", value: tourPackage.is_featured ? 'Yes' : 'No' },
  ];

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {tourPackage.name}
            </h1>
            <div className="inline-flex items-center rounded-md bg-muted p-1 text-muted-foreground">
                <Button 
                    variant="ghost"
                    size="sm" 
                    className={cn(
                        "px-3 py-1 h-auto text-xs",
                        status === true ? "bg-green-500/10 text-green-700 shadow-sm hover:bg-green-500/20 hover:text-green-700" : "hover:bg-muted"
                    )} 
                    onClick={() => handleStatusChange(true)}>
                    Active
                </Button>
                <Button 
                    variant="ghost"
                    size="sm" 
                    className={cn(
                        "px-3 py-1 h-auto text-xs",
                        status === false ? "bg-red-500/10 text-red-700 shadow-sm hover:bg-red-500/20 hover:text-red-700" : "hover:bg-muted"
                    )} 
                    onClick={() => handleStatusChange(false)}>
                    Inactive
                </Button>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
                <Button size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
            <Card>
                 <CardHeader className="p-4 border-b">
                    <TabsList className="grid w-full grid-cols-4 p-0 bg-transparent border-0 shadow-none">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="booking">Booking</TabsTrigger>
                        <TabsTrigger value="trip_days">Trip Days</TabsTrigger>
                        <TabsTrigger value="review">Review</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="p-0">
                    <TabsContent value="overview">
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Image and core details */}
                                <div className="space-y-6">
                                    <Carousel className="w-full">
                                        <CarouselContent>
                                            {(tourPackage.image_urls || []).concat(tourPackage.featured_image_url ? [tourPackage.featured_image_url] : []).filter(Boolean).map((img, index) => (
                                                <CarouselItem key={index}>
                                                    <Image
                                                        alt={`${tourPackage.name} image ${index + 1}`}
                                                        className="aspect-video w-full rounded-md object-cover"
                                                        height={450}
                                                        src={img}
                                                        width={800}
                                                    />
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                                    </Carousel>
                                    
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold">{tourPackage.name}</h2>
                                        <p className="text-muted-foreground">{tourPackage.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary" className="capitalize">{tourPackage.package_type}</Badge>
                                        <Badge variant="outline" className="capitalize">{tourPackage.category}</Badge>
                                    </div>

                                </div>
                                {/* Right Column: Pricing, details, policies */}
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
                                                        <p>{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {tourPackage.payInParts && tourPackage.payInParts.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Pay in Parts</h3>
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {tourPackage.payInParts.map((part, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{part.partName}</TableCell>
                                                            <TableCell>{part.durationMonths} months</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(part.price)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <Separator className="my-8" />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><Plus className="text-accent"/> Highlights</h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        {tourPackage.highlights.map((h, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /><span>{h}</span></li>)}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><Check className="text-green-500"/> Inclusions</h3>
                                     <p className="text-sm text-muted-foreground leading-relaxed">{tourPackage.inclusion}</p>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><X className="text-red-500"/> Exclusions</h3>
                                     <p className="text-sm text-muted-foreground leading-relaxed">{tourPackage.exclusion}</p>
                                </div>
                            </div>
                            
                            <Separator className="my-8" />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {([
                                    { title: 'Booking Policies', content: tourPackage.booking_policy },
                                    { title: 'Cancellation Policies', content: tourPackage.cancellation_policy },
                                    { title: 'Terms & Conditions', content: tourPackage.terms_and_conditions },
                                ]).map(policy => {
                                    if (!policy.content) return null;
                                    return (
                                        <div key={policy.title} className="space-y-3">
                                            <h3 className="text-lg font-semibold flex items-center gap-2"><Info /> {policy.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{policy.content}</p>
                                        </div>
                                    )
                                })}
                            </div>
                             <CardFooter className="p-0 pt-6">
                                <div className="text-xs text-muted-foreground">
                                    Last updated on {format(new Date(tourPackage.updatedAt), "PPP")}
                                </div>
                            </CardFooter>
                        </div>
                       
                    </TabsContent>

                    <TabsContent value="booking" className="p-6">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Booking ID</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Reservation Date</TableHead>
                                  <TableHead>Transaction ID</TableHead>
                                  <TableHead>Payment Type</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Referral Code</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bookingsForPackage.length > 0 ? (
                                  bookingsForPackage.map((booking) => (
                                    <TableRow key={booking.id}>
                                      <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                                      <TableCell>
                                        <div className="font-medium">{booking.customerName}</div>
                                        <div className="text-sm text-muted-foreground hidden md:inline">{booking.customerEmail}</div>
                                      </TableCell>
                                      <TableCell>{format(new Date(booking.reservationDate), "PPP")}</TableCell>
                                      <TableCell className="font-mono text-xs">{booking.transactionId}</TableCell>
                                      <TableCell className="capitalize">{booking.paymentType}</TableCell>
                                      <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                                      <TableCell>{booking.referralCode || 'N/A'}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={getStatusBadgeColor(booking.status)}>
                                          {booking.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                      No bookings found for this package.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                    </TabsContent>

                    <TabsContent value="trip_days" className="p-6">
                      <div className="space-y-6">
                        {tripDaysForPackage.length > 0 ? (
                          tripDaysForPackage.map((day) => (
                            <Card key={day.id} className="overflow-hidden">
                              <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Day {day.dayNumber}: {day.dayName}</CardTitle>
                                    <CardDescription>{day.activities.length} activities planned</CardDescription>
                                </div>
                                <Button asChild size="sm" variant="outline" className="ml-auto gap-1">
                                    <Link href={`/dashboard/trip-days/${day.id}`}>
                                        View All Activities
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                              </CardHeader>
                              <CardContent className="p-6 space-y-4">
                                {day.activities.slice(0, 2).map((activity, index) => (
                                    <div
                                    key={`${activity.activityId}-${index}`}
                                    className="flex items-start gap-4 p-4 border rounded-lg"
                                    >
                                    <div className="bg-muted p-3 rounded-md mt-1">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="grid gap-1 flex-1">
                                        <p className="font-semibold">
                                        {activity.name}{" "}
                                        <span className="text-xs font-normal text-muted-foreground capitalize">
                                            ({activity.type})
                                        </span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                        {activity.description}
                                        </p>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                                        <span>Time: {activity.time}</span>
                                        <span>Duration: {activity.duration}</span>
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                {day.activities.length > 2 && (
                                    <div className="text-center text-sm text-muted-foreground">
                                        + {day.activities.length - 2} more activities...
                                    </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-8 h-24">
                            No trip days defined for this package.
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="review" className="p-6">
                        <div className="grid gap-6">
                            {reviewsForPackage.length > 0 ? reviewsForPackage.map(review => (
                            <div key={review.id} className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 border">
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${review.userId}`} />
                                <AvatarFallback>{review.customerName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1.5 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.customerName}</p>
                                    <div className="flex items-center gap-0.5 text-muted-foreground">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`}
                                        />
                                    ))}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                                <p className="text-xs text-muted-foreground mt-1">{format(new Date(review.createdAt), "PPP")}</p>
                                </div>
                            </div>
                            )) : <div className="text-center text-muted-foreground py-8 h-24">No reviews yet for this package.</div>}
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}

    