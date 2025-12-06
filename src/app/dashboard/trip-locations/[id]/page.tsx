"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, MapPin, Globe, Building } from "lucide-react";
import mockData from "@/lib/data";
import { getStatusBadgeColor } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";

export default function TripLocationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const location = mockData.tripLocations.find((loc) => loc.id === id);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Location Not Found</h1>
        <p className="text-muted-foreground">The requested location does not exist.</p>
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
          {location.locationName}
        </h1>
        <Badge variant="outline" className={getStatusBadgeColor(location.status)}>{location.status}</Badge>
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
          <CardTitle>{location.locationName}</CardTitle>
          <CardDescription>{location.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="grid gap-4">
                <Carousel className="w-full relative">
                    <CarouselContent>
                        {location.images.map((img, index) => (
                        <CarouselItem key={index}>
                            <Image
                                alt={`${location.locationName} image ${index + 1}`}
                                className="aspect-video w-full rounded-md object-cover"
                                height="400"
                                src={img}
                                width="600"
                            />
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 hover:text-white border-none" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 hover:text-white border-none" />
                </Carousel>
                <div>
                    <h3 className="font-semibold text-lg mb-2">Address</h3>
                    <div className="flex items-start gap-3 text-muted-foreground">
                        <MapPin className="h-5 w-5 mt-1" />
                        <p>{location.address}</p>
                    </div>
                </div>
            </div>
          <div className="grid gap-6 text-sm">
            <h3 className="font-semibold text-lg">Location Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-semibold text-muted-foreground">City</div>
                  <p>{location.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Building className="h-5 w-5 text-muted-foreground" />
                 <div>
                    <div className="font-semibold text-muted-foreground">State</div>
                    <p>{location.state}</p>
                 </div>
              </div>
               <div className="flex items-center gap-2">
                 <Building className="h-5 w-5 text-muted-foreground" />
                 <div>
                    <div className="font-semibold text-muted-foreground">District</div>
                    <p>{location.district}</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                 <div>
                    <div className="font-semibold text-muted-foreground">Country</div>
                    <p>{location.country}</p>
                 </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-muted-foreground">Type</div>
                <Badge variant="secondary" className="capitalize mt-1">{location.type}</Badge>
              </div>
              <div>
                <div className="font-semibold text-muted-foreground">Code</div>
                <p className="mt-1">{location.code}</p>
              </div>
              <div>
                <div className="font-semibold text-muted-foreground">Latitude</div>
                <p className="mt-1">{location.latitude}</p>
              </div>
              <div>
                <div className="font-semibold text-muted-foreground">Longitude</div>
                <p className="mt-1">{location.longitude}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
