
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign } from "lucide-react";
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
import type { TripDay } from "@/lib/types";
import { getTripDayById, deleteTripDay } from "@/lib/supabase/queries";
import { formatCurrency } from "@/lib/utils";

export default function TripDayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();

  const [tripDay, setTripDay] = React.useState<TripDay | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      const fetchTripDay = async () => {
        setLoading(true);
        const day = await getTripDayById(id);
        console.log('Fetched Trip Day with Activities:', day);
        if (day) {
          setTripDay(day);
        } else {
           toast({ variant: "destructive", title: "Error", description: "Trip day not found." });
           router.push('/dashboard/trip-days');
        }
        setLoading(false);
      };
      fetchTripDay();
    }
  }, [id, toast, router]);

  const handleDelete = async () => {
    try {
      await deleteTripDay(id);
      toast({
        title: "Success",
        description: `Trip day "${tripDay?.day_name}" has been deleted.`,
      });
      router.push('/dashboard/trip-days');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete trip day.",
      });
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>
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

  return (
    <div className="flex flex-col gap-4">
       <AlertDialog>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {tripDay.day_name}
            </h1>
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
            <CardTitle>Day {tripDay.day_number}: {tripDay.day_name}</CardTitle>
            <CardDescription>
                Part of the <span className="font-semibold text-primary">{tripDay.tour_package?.name || 'N/A'}</span> tour package.
            </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
            <div>
                <h3 className="font-semibold mb-2">Daily Itinerary</h3>
                <p className="text-muted-foreground">{tripDay.description}</p>
            </div>
            {tripDay.special_instructions && (
                <div>
                <h3 className="font-semibold mb-2">Special Instructions</h3>
                <p className="text-muted-foreground">{tripDay.special_instructions}</p>
                </div>
            )}
            <div>
                <h3 className="font-semibold mb-4">Activities</h3>
                <div className="grid gap-4">
                {(tripDay.activities && tripDay.activities.length > 0) ? (
                  tripDay.activities.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="bg-muted p-3 rounded-md mt-1">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="grid gap-1 flex-1">
                        <p className="font-semibold">{activity.title} <span className="text-xs font-normal text-muted-foreground capitalize">({activity.activity_type})</span></p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
                          <span>Time: {activity.activity_time ? activity.activity_time.substring(0, 5) : 'N/A'}</span>
                          <span>Duration: {activity.duration_minutes} mins</span>
                        </div>
                        <div className="flex items-center text-sm gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            {activity.cost_included ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <span>Cost Included</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {activity.booking_required ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <span>Booking Required</span>
                          </div>
                        </div>
                        {activity.additional_cost && Number(activity.additional_cost) > 0 && (
                            <div className="flex items-center text-sm gap-2 mt-2 text-amber-600">
                                <DollarSign className="h-4 w-4" />
                                <span>Additional Cost: {formatCurrency(Number(activity.additional_cost))}</span>
                            </div>
                        )}
                        {activity.special_instructions && (
                          <div className="flex items-start text-sm gap-2 mt-2 text-sky-600">
                            <AlertTriangle className="h-4 w-4 mt-0.5" />
                            <span>{activity.special_instructions}</span>
                          </div>
                        )}
                      </div>
                    </div>
                ))) : (
                  <p className="text-muted-foreground text-center">No activities planned for this day.</p>
                )}
                </div>
            </div>
            </CardContent>
        </Card>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the trip day "{tripDay.day_name}".
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
