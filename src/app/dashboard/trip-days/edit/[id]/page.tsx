
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TripDay } from "@/lib/types";
import { getTripDayById, updateTripDay } from "@/lib/supabase/queries";
import { ActivityFormModal, activitySchema } from "@/app/dashboard/trip-days/create/_components/ActivityFormModal";


const tripDayEditSchema = z.object({
  day_name: z.string().min(1, "Day name is required"),
  day_number: z.coerce.number().int().min(1),
  description: z.string().min(1, "Description is required"),
  special_instructions: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  activities: z.array(activitySchema).optional()
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
    defaultValues: {},
  });

  React.useEffect(() => {
    if (id) {
      const fetchDay = async () => {
        setLoading(true);
        const day = await getTripDayById(id);
        if (day) {
          form.reset({
            day_name: day.day_name,
            day_number: day.day_number,
            description: day.description,
            special_instructions: day.special_instructions,
            status: day.status,
            activities: day.activities || []
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
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Day's Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="special_instructions" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Special Instructions</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
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
                <Card key={activity.id} className="bg-muted/30 p-4">
                    <div className="flex justify-between items-start">
                        <div className="grid gap-1">
                            <p className="font-semibold">{activity.name} <span className="text-xs font-normal text-muted-foreground capitalize">({activity.type})</span></p>
                            <p className="text-sm text-muted-foreground">{activity.time} &bull; {activity.duration} &bull; {activity.location}</p>
                            <p className="text-sm text-muted-foreground mt-2">{activity.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
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
