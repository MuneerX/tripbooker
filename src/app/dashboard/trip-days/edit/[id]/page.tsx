
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import mockData from "@/lib/data";

export default function EditTripDayPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const tripDay = mockData.tripDays.find((day) => day.id === id);

  if (!tripDay && id.startsWith('day_')) {
    // This is a newly created day that doesn't exist in mockData yet.
    // We can show a generic editor.
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
                <h1 className="text-xl font-semibold">Edit Trip Day</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Activities</CardTitle>
                    <CardDescription>Add, edit, or remove activities for this trip day.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-12 text-center">
                        <h3 className="text-lg font-semibold">Activity management coming soon!</h3>
                        <p className="text-sm text-muted-foreground">This is where you will add and edit activities.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

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

  // Placeholder for editing an existing trip day from mockData
  return (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
               <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
            <h1 className="text-xl font-semibold">Edit Day {tripDay.dayNumber}: {tripDay.dayName}</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Manage Activities</CardTitle>
                <CardDescription>Add, edit, or remove activities for this trip day.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-12 text-center">
                    <h3 className="text-lg font-semibold">Activity management coming soon!</h3>
                    <p className="text-sm text-muted-foreground">This is where you will add and edit activities for existing trip days.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
