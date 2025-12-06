"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import mockData from "@/lib/data";
import { formatCurrency, getStatusBadgeColor } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="flex flex-col gap-4">
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
        <CardHeader>
            <CardTitle>Tour Package Details</CardTitle>
            <CardDescription>{tourPackage.description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 grid gap-6">
                    <div>
                        <Image
                            alt={tourPackage.tourName}
                            className="aspect-video w-full rounded-md object-cover"
                            height="310"
                            src={tourPackage.imageUrl}
                            width="550"
                        />
                    </div>
                    <div className="grid gap-3">
                        <h3 className="font-semibold">Highlights</h3>
                        <ul className="grid gap-3 list-disc list-inside">
                            {tourPackage.highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                    </div>
                     <Separator />
                    <div className="grid gap-3">
                        <h3 className="font-semibold">Itinerary Summary</h3>
                        <p className="text-sm text-muted-foreground">
                            A {tourPackage.days}-day journey through the most scenic routes.
                        </p>
                    </div>

                </div>
                <div className="grid gap-6 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Base Price</div>
                        <div>{formatCurrency(tourPackage.basePrice)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Duration</div>
                        <div>{tourPackage.days} Days / {tourPackage.nights} Nights</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Tour Type</div>
                        <div className="capitalize">{tourPackage.tourType}</div>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Category</div>
                        <div className="capitalize">{tourPackage.category}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Featured</div>
                        <div>{tourPackage.isFeatured ? 'Yes' : 'No'}</div>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="font-semibold">Max Guests</div>
                        <div>{tourPackage.maxPermittedBooking}</div>
                    </div>
                     <Separator />
                     <div className="grid gap-3">
                        <h3 className="font-semibold">Inclusions</h3>
                        <ul className="list-disc list-inside text-muted-foreground">
                             {tourPackage.inclusions.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                     </div>
                     <div className="grid gap-3">
                        <h3 className="font-semibold">Exclusions</h3>
                        <ul className="list-disc list-inside text-muted-foreground">
                             {tourPackage.exclusions.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                     </div>
                </div>
            </div>
        </CardContent>
        <CardFooter>
             <div className="text-xs text-muted-foreground">
                Last updated on {tourPackage.updatedAt.toLocaleDateString()}
            </div>
        </CardFooter>
        </Card>
    </div>
  );
}
