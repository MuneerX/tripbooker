
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Calendar, Users, Clock, Moon, Check, X, Info } from "lucide-react";
import mockData from "@/lib/data";
import { formatCurrency, getStatusBadgeColor } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function TourPackageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const tourPackage = mockData.tourPackages.find((pkg) => pkg.id === id);

  if (!tourPackage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Tour Package Not Found</h1>
        <p className="text-muted-foreground">The requested tour package does not exist.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const detailItems = [
    { icon: <Clock />, label: "Duration", value: `${tourPackage.days} Days / ${tourPackage.nights} Nights` },
    { icon: <Users />, label: "Max Guests", value: tourPackage.maxPermittedBooking },
    { icon: <Calendar />, label: "Introduced", value: format(tourPackage.introductionDate, "PPP") },
    { icon: <Calendar />, label: "Starts On", value: tourPackage.withdrawalDate ? format(tourPackage.withdrawalDate, "PPP") : 'N/A' }, // Using withdrawalDate as startDate for mock data
    { icon: <Check className="text-green-500" />, label: "Featured", value: tourPackage.isFeatured ? 'Yes' : 'No' },
  ];

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {tourPackage.tourName}
            </h1>
            <Badge variant="outline" className={getStatusBadgeColor(tourPackage.status)}>{tourPackage.status}</Badge>
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
        
        <Card>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Image and core details */}
                    <div className="space-y-6">
                        <Carousel className="w-full">
                            <CarouselContent>
                                {[tourPackage.imageUrl, tourPackage.featuredImageUrl, ...[...Array(2)].map((_, i) => `https://picsum.photos/seed/${tourPackage.id}-${i}/800/600`)].filter(Boolean).map((img, index) => (
                                    <CarouselItem key={index}>
                                        <Image
                                            alt={`${tourPackage.tourName} image ${index + 1}`}
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
                            <h2 className="text-2xl font-bold">{tourPackage.tourName}</h2>
                            <p className="text-muted-foreground">{tourPackage.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="capitalize">{tourPackage.tourType}</Badge>
                            <Badge variant="outline" className="capitalize">{tourPackage.category}</Badge>
                        </div>

                    </div>
                    {/* Right Column: Pricing, details, policies */}
                    <div className="space-y-6">
                        <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-muted-foreground">Base Price</span>
                                <span className="text-3xl font-bold text-primary">{formatCurrency(tourPackage.basePrice)}</span>
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
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Check className="text-green-500"/> Highlights</h3>
                        <ul className="space-y-2 text-muted-foreground">
                            {tourPackage.highlights.map((h, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" /><span>{h}</span></li>)}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Check className="text-green-500"/> Inclusions</h3>
                        <ul className="space-y-2 text-muted-foreground">
                             {tourPackage.inclusions.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" /><span>{item}</span></li>)}
                        </ul>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><X className="text-red-500"/> Exclusions</h3>
                        <ul className="space-y-2 text-muted-foreground">
                             {tourPackage.exclusions.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive" /><span>{item}</span></li>)}
                        </ul>
                     </div>
                </div>
                
                 <Separator className="my-8" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {(['booking', 'cancellation', 'termsAndConditions'] as const).map(policyType => {
                        const titleMap = { booking: 'Booking Policies', cancellation: 'Cancellation Policies', termsAndConditions: 'Terms & Conditions' };
                        const content = policyType === 'termsAndConditions' ? tourPackage.termsAndConditions : tourPackage[`${policyType}Policies`];
                        if (!content) return null;
                        return (
                            <div key={policyType} className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><Info /> {titleMap[policyType]}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
                            </div>
                        )
                    })}
                </div>

            </CardContent>
             <CardFooter>
                 <div className="text-xs text-muted-foreground">
                    Last updated on {format(tourPackage.updatedAt, "PPP")}
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
