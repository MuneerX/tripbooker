
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import mockData from "@/lib/data";
import { getStatusBadgeColor } from "@/lib/utils";
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

export default function TripDayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const tripDay = mockData.tripDays.find((day) => day.id === id);
  const tourPackage = tripDay ? mockData.tourPackages.find(pkg => pkg.id === tripDay.tourPackageId) : undefined;

  const handleDelete = () => {
    const dayIndex = mockData.tripDays.findIndex(d => d.id === id);
    if (dayIndex !== -1) {
      mockData.tripDays.splice(dayIndex, 1);
      toast({
        title: "Success",
        description: `Trip day "${tripDay?.dayName}" has been deleted.`,
      });
      router.push('/dashboard/trip-days');
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete trip day.",
      });
    }
  };

  if (!tripDay) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Trip Day Not Found</h1>
        <p className="text-muted-foreground">The requested trip day does not exist.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
       <AlertDialog>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {tripDay.dayName}
            </h1>
            <Badge variant="outline" className={getStatusBadgeColor(tripDay.status)}>{tripDay.status}</Badge>
            <div className="ml-auto flex items-center gap-2">
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <Button size="sm" onClick={() => router.push(`/dashboard/trip-days/edit/${id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
            </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Day {tripDay.dayNumber}: {tripDay.dayName}</CardTitle>
            <CardDescription>
                Part of the <span className="font-semibold text-primary">{tourPackage?.tourName || 'N/A'}</span> tour package.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
            <div>
                <h3 className="font-semibold mb-2">Daily Itinerary</h3>
                <p className="text-muted-foreground">{tripDay.description}</p>
            </div>
            {tripDay.specialInstructions && (
                <div>
                <h3 className="font-semibold mb-2">Special Instructions</h3>
                <p className="text-muted-foreground">{tripDay.specialInstructions}</p>
                </div>
            )}
            <div>
                <h3 className="font-semibold mb-4">Activities</h3>
                <div className="grid gap-4">
                {tripDay.activities.map((activity, index) => (
                    <div key={`${activity.activityId}-${index}`} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="bg-muted p-3 rounded-md">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="grid gap-1 flex-1">
                            <p className="font-semibold">{activity.name} <span className="text-xs font-normal text-muted-foreground">({activity.type})</span></p>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                                <span>Time: {activity.time}</span>
                                <span>Duration: {activity.duration}</span>
                                <span>Location: {activity.location}</span>
                            </div>
                            <div className="flex items-center text-sm gap-4 mt-2">
                            <div className="flex items-center gap-1">
                                    {activity.priceIncluded ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                    <span>Price Included</span>
                            </div>
                            <div className="flex items-center gap-1">
                                    {activity.bookingRequired ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                    <span>Booking Required</span>
                            </div>
                            </div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            </CardContent>
        </Card>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the trip day "{tripDay.dayName}".
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
