"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import mockData from "@/lib/data";
import { getStatusBadgeColor } from "@/lib/utils";

export default function TripDayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const tripDay = mockData.tripDays.find((day) => day.id === id);
  const tourPackage = tripDay ? mockData.tourPackages.find(pkg => pkg.id === tripDay.tourPackageId) : undefined;

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
              {tripDay.activities.map(activity => (
                <div key={activity.activityId} className="flex items-start gap-4 p-4 border rounded-lg">
                   <div className="bg-muted p-3 rounded-md">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                   </div>
                   <div className="grid gap-1 flex-1">
                        <p className="font-semibold">{activity.name} <span className="text-xs font-normal text-muted-foreground">({activity.type})</span></p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                            <span>Location: {activity.location}</span>
                            <span>Duration: {activity.duration}</span>
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
    </div>
  );
}
