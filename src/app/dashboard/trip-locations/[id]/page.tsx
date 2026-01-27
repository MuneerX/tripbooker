
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, MapPin, Globe, Building } from "lucide-react";
import { getStatusBadgeColor } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { getTripLocationById, deleteTripLocation } from "@/lib/supabase/queries";
import type { TripLocation } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
import { useBreadcrumb } from "../../layout";

export default function TripLocationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();
  
  const [location, setLocation] = React.useState<TripLocation | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      const fetchLocation = async () => {
        setLoading(true);
        const loc = await getTripLocationById(id);
        if (loc) {
          setLocation(loc);
          setBreadcrumbName(loc.name);
        } else {
          toast({ variant: "destructive", title: "Error", description: "Location not found." });
          setBreadcrumbName('Not Found');
          router.push('/dashboard/trip-locations');
        }
        setLoading(false);
      };
      fetchLocation();
    }
    // Clear on unmount
    return () => setBreadcrumbName('');
  }, [id, router, toast, setBreadcrumbName]);

  const handleDelete = async () => {
    if (!location) return;
    try {
      await deleteTripLocation(location);
      toast({
        title: "Success",
        description: `Location "${location.name}" has been deleted.`,
      });
      router.push('/dashboard/trip-locations');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete location.",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>
  }

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
      <AlertDialog>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {location.name}
          </h1>
          <Badge variant="outline" className={getStatusBadgeColor(location.is_active ? 'active' : 'inactive')}>{location.is_active ? 'Active' : 'Inactive'}</Badge>
          <div className="flex w-full flex-col items-stretch gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <Button size="sm" onClick={() => router.push(`/dashboard/trip-locations/edit/${id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{location.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="grid gap-4">
                    <Carousel className="w-full relative">
                        <CarouselContent>
                            {location.image_urls && location.image_urls.length > 0 ? location.image_urls.map((img, index) => (
                            <CarouselItem key={index}>
                                <Image
                                    alt={`${location.name} image ${index + 1}`}
                                    className="aspect-video w-full rounded-md object-cover"
                                    height="400"
                                    src={img}
                                    width="600"
                                />
                            </CarouselItem>
                            )) : (
                              <CarouselItem>
                                 <div className="aspect-video w-full rounded-md object-cover bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground">No Image</span>
                                 </div>
                              </CarouselItem>
                            )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2">
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
                    <Badge variant="secondary" className="capitalize mt-1">{location.place_type}</Badge>
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
            </div>
            <Separator className="my-6" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground">{location.description}</p>
            </div>
          </CardContent>
        </Card>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the location "{location.name}" and all associated images from storage.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
