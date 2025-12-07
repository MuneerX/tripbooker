
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, PlusCircle, Trash2, DollarSign, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTripDayById, updateTripDay } from "@/lib/supabase/queries";
import { ActivityFormModal, activitySchema } from "@/app/dashboard/trip-days/create/_components/ActivityFormModal";
import { formatCurrency } from "@/lib/utils";


const tripDayEditSchema = z.object({
  day_name: z.string().min(1, "Day name is required"),
  day_number: z.coerce.number().int().min(1),
  description: z.string().min(1, "Description is required"),
  activities: z.array(activitySchema).optional(),
  title: z.string().optional(),
  accommodation_type: z.string().optional(),
  accommodation_name: z.string().optional(),
  meals_included: z.array(z.string()).optional(),
});

type TripDayEditFormValues = z.infer<typeof tripDayEditSchema>;

export default function EditTripDayPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TripDayEditFormValues>({
    resolver: zodResolver(tripDayEditSchema),
    defaultValues: {
        day_name: "",
        day_number: 1,
        description: "",
        title: "",
        accommodation_type: "",
        accommodation_name: "",
        meals_included: [],
        activities: [],
    },
  });

  React.useEffect(() => {
    if (id) {
      const fetchDay = async () => {
        setLoading(true);
        const day = await getTripDayById(id);
        if (day) {
          form.reset({
            day_name: day.day_name || '',
            day_number: day.day_number,
            description: day.description || '',
            title: day.title || '',
            accommodation_type: day.accommodation_type || '',
            accommodation_name: day.accommodation_name || '',
            meals_included: day.meals_included || [],
            activities: (day.activities || []).map(act => ({
              ...act,
              activity_time: act.activity_time ? act.activity_time.substring(0, 5) : '',
            }))
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Trip Day not found." });
          router.push('/dashboard/trip-days');
        }
        setLoading(false);
      };
      fetchDay();
    }
  }, [id, router, toast, form]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "activities"
  });

  const onSubmit = async (data: TripDayEditFormValues) => {
    setIsSubmitting(true);
    try {
      await updateTripDay(id, data);
       toast({
        title: "Success!",
        description: `Day ${data.day_number}: ${data.day_name} has been updated.`,
      });
      router.push('/dashboard/trip-days');
      router.refresh();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error updating trip day",
        description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>
  }

  const originalDayName = form.getValues('day_name');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 text-xl font-semibold">
            Edit Day: {originalDayName}
          </h1>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Day Details</CardTitle>
            <CardDescription>Edit the main information for this day.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <FormField control={form.control} name="day_name" render={({ field }) => ( <FormItem><FormLabel>Day Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="day_number" render={({ field }) => ( <FormItem><FormLabel>Day Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Day's Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="accommodation_type" render={({ field }) => ( <FormItem><FormLabel>Accommodation Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="accommodation_name" render={({ field }) => ( <FormItem><FormLabel>Accommodation Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Manage Activities</CardTitle>
              <CardDescription>Add, edit, or remove activities for this day.</CardDescription>
            </div>
            <ActivityFormModal onSave={(newActivity) => append(newActivity)}>
              <Button type="button" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
              </Button>
            </ActivityFormModal>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length > 0 ? (
              fields.map((activity, index) => (
                <Card key={activity.id || `new-${index}`} className="bg-muted/30 p-4">
                    <div className="flex justify-between items-start">
                        <div className="grid gap-2 flex-1">
                            <div className="flex justify-between">
                                <p className="font-semibold">{activity.title} <span className="text-xs font-normal text-muted-foreground capitalize">({activity.activity_type})</span></p>
                                <p className="text-sm text-muted-foreground">{activity.activity_time ? activity.activity_time.substring(0,5) : ''} &bull; {activity.duration_minutes} mins</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            
                            {activity.special_instructions && (
                                <div className="flex items-start text-sm gap-2 mt-2 text-sky-600">
                                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                                    <span>{activity.special_instructions}</span>
                                </div>
                            )}

                            <div className="flex items-center text-sm gap-4 mt-2">
                                <div className="flex items-center gap-1.5">
                                    {activity.cost_included ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                    <span className="text-muted-foreground">Cost Included</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {activity.booking_required ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                    <span className="text-muted-foreground">Booking Required</span>
                                </div>
                                {activity.additional_cost && Number(activity.additional_cost) > 0 && (
                                    <div className="flex items-center gap-1.5 text-amber-600">
                                        <DollarSign className="h-4 w-4" />
                                        <span className="text-muted-foreground">Extra: {formatCurrency(Number(activity.additional_cost))}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pl-4">
                             <ActivityFormModal 
                                activity={activity} 
                                onSave={(editedActivity) => update(index, editedActivity)}
                             >
                                <Button type="button" variant="outline" size="sm">Edit</Button>
                            </ActivityFormModal>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-12 text-center">
                <h3 className="text-lg font-semibold">No activities yet</h3>
                <p className="text-sm text-muted-foreground">Click "Add Activity" to start planning the day.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
