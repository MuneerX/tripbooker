
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Calendar, Users, Clock, Check, X, Plus, Info, Star, CheckCircle, XCircle, ArrowUpRight, Sun, Moon } from "lucide-react";
import { formatCurrency, getStatusBadgeColor, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getTourPackageById, deleteTourPackage, getTripDaysForPackage, getBookings, getReviews } from "@/lib/supabase/queries";
import type { TourPackage, Booking, TripDay, Review, Activity } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumb } from "../../layout";


export default function TourPackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();

  const [tourPackage, setTourPackage] = React.useState<TourPackage | null>(null);
  const [tripDaysForPackage, setTripDaysForPackage] = React.useState<TripDay[]>([]);
  const [bookingsForPackage, setBookingsForPackage] = React.useState<Booking[]>([]);
  const [reviewsForPackage, setReviewsForPackage] = React.useState<Review[]>([]);

  React.useEffect(() => {
    if (id) {
      const fetchPackageAndRelatedData = async () => {
        const pkg = await getTourPackageById(id);
        setTourPackage(pkg);

        if (pkg) {
          setBreadcrumbName(pkg.name);
          const [tripDays, bookings, reviews] = await Promise.all([
            getTripDaysForPackage(pkg.id),
            getBookings(pkg.id),
            getReviews(pkg.id)
          ]);
          setTripDaysForPackage(tripDays);
          setBookingsForPackage(bookings);
          setReviewsForPackage(reviews);
        } else {
           setBreadcrumbName('Not Found');
        }
      };
      fetchPackageAndRelatedData();
    }
     // Clear on unmount
    return () => setBreadcrumbName('');
  }, [id, setBreadcrumbName]);

  const allImages = React.useMemo(() => {
    if (!tourPackage) return [];
    const images = new Set<string>();
    if (tourPackage.featured_image_url) {
      images.add(tourPackage.featured_image_url);
    }
    if (tourPackage.image_urls) {
      tourPackage.image_urls.forEach(url => {
        if (url !== tourPackage.featured_image_url) { // Ensure no duplicates if featured is also in gallery
            images.add(url);
        }
      });
    }
    return Array.from(images);
  }, [tourPackage]);


   const handleDelete = async () => {
    if (!tourPackage) return;
    try {
      await deleteTourPackage(tourPackage);
      toast({
        title: "Success",
        description: `Tour package "${tourPackage.name}" has been deleted.`,
      });
      router.push('/dashboard/tour-packages');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting package",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  if (!tourPackage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Loading Tour Package...</h1>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  const detailItems = [
    { icon: <Clock />, label: "Duration", value: `${tourPackage.days} Days / ${tourPackage.nights} Nights` },
    { icon: <Users />, label: "Maximum Guests", value: tourPackage.max_guests },
    { icon: <Calendar />, label: "Introduced", value: tourPackage.created_at ? format(new Date(tourPackage.created_at), "PPP") : 'N/A' },
    { icon: <Calendar />, label: "Withdrawal Date", value: tourPackage.withdrawalDate ? format(new Date(tourPackage.withdrawalDate), "PPP") : 'N/A' },
    { icon: <Check className="text-green-500" />, label: "Featured", value: tourPackage.is_featured ? 'Yes' : 'No' },
  ];
  
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
  

  return (
    <div className="space-y-6">
      <AlertDialog>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {tourPackage.name}
            </h1>
            <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(tourPackage.is_active ? 'active' : 'inactive'))}>
                {tourPackage.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <div className="ml-auto flex items-center gap-2">
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                  </Button>
                </AlertDialogTrigger>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/tour-packages/edit/${tourPackage.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                  </Link>
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
                                            {allImages.map((img, index) => (
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
                                                        <p>{String(item.value)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {tourPackage.pay_in_parts && tourPackage.pay_in_parts.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Pay in Parts</h3>
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Plan Name</TableHead><TableHead>Months</TableHead><TableHead>Monthly Payment</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {tourPackage.pay_in_parts.map((part, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{part.plan_name}</TableCell>
                                                            <TableCell>{part.months}</TableCell>
                                                            <TableCell>{formatCurrency(part.monthly_payment)}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(part.total_amount)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <Separator className="my-8" />
                            
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
                                            {renderPointList(policy.content)}
                                        </div>
                                    )
                                })}
                            </div>
                             <CardFooter className="p-0 pt-6">
                                <div className="text-xs text-muted-foreground">
                                    Last updated on {tourPackage.updated_at ? format(new Date(tourPackage.updated_at), "PPP") : 'N/A'}
                                </div>
                            </CardFooter>
                        </div>
                       
                    </TabsContent>

                    <TabsContent value="booking" className="p-6">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Booking Ref</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Booking Date</TableHead>
                                  <TableHead>Travel Date</TableHead>
                                  <TableHead>Payment</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Guests</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bookingsForPackage.length > 0 ? (
                                  bookingsForPackage.map((booking) => (
                                    <TableRow key={booking.id}>
                                      <TableCell className="font-mono text-xs">{booking.booking_reference}</TableCell>
                                      <TableCell>
                                        <div className="font-medium">{booking.customer_name}</div>
                                        <div className="text-sm text-muted-foreground hidden md:inline">{booking.customer_email}</div>
                                      </TableCell>
                                      <TableCell>{format(new Date(booking.booking_date), "PPP")}</TableCell>
                                      <TableCell>{booking.travel_date ? format(new Date(booking.travel_date), "PPP") : 'N/A'}</TableCell>
                                      <TableCell className="capitalize">{booking.payment_status}</TableCell>
                                      <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
                                      <TableCell>{booking.total_adults + booking.total_children}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(booking.booking_status))}>
                                          {booking.booking_status}
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
                                    <CardTitle>Day {day.day_number}: {day.day_name}</CardTitle>
                                    <CardDescription>{day.activities?.length || 0} activities planned</CardDescription>
                                </div>
                                <Button asChild size="sm" variant="outline" className="ml-auto gap-1">
                                    <Link href={`/dashboard/trip-days/${day.id}`}>
                                        View All Activities
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                              </CardHeader>
                              <CardContent className="p-6 space-y-4">
                                {day.activities && day.activities.length > 0 ? day.activities.slice(0, 2).map((activity, index) => (
                                    <div
                                    key={`${activity.id}-${index}`}
                                    className="flex items-start gap-4 p-4 border rounded-lg"
                                    >
                                    <div className="bg-muted p-3 rounded-md mt-1">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="grid gap-1 flex-1">
                                        <p className="font-semibold">
                                        {activity.title}{" "}
                                        <span className="text-xs font-normal text-muted-foreground capitalize">
                                            ({activity.activity_type})
                                        </span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                        {activity.description}
                                        </p>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                                        <span>Time: {activity.activity_time}</span>
                                        <span>Duration: {activity.duration_minutes} mins</span>
                                        </div>
                                    </div>
                                    </div>
                                )) : null}
                                {day.activities && day.activities.length > 2 && (
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
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${review.user_id}`} />
                                <AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1.5 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.customer_name}</p>
                                    <div className="flex items-center gap-0.5 text-muted-foreground">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`}
                                        />
                                    ))}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{review.review_text}</p>
                                <p className="text-xs text-muted-foreground mt-1">{format(new Date(review.created_at), "PPP")}</p>
                                </div>
                            </div>
                            )) : <div className="text-center text-muted-foreground py-8 h-24">No reviews yet for this package.</div>}
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
         <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tour package "{tourPackage.name}" and all of its associated images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    