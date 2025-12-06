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
import mockData from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import type { TripDay } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

const activitySchema = z.object({
    activityId: z.string().optional(),
    name: z.string().min(1, "Activity name is required"),
    type: z.enum(["trekking", "sightseeing", "meal", "transport", "accommodation", "adventure", "shopping", "leisure"]),
    time: z.string().regex(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Invalid time format (e.g., 09:00 AM)"),
    duration: z.string().min(1, "Duration is required"),
    location: z.string().min(1, "Location is required"),
    price: z.coerce.number().min(0).default(0),
    priceIncluded: z.boolean().default(true),
    bookingRequired: z.boolean().default(false),
    description: z.string().min(1, "Description is required"),
});

const tripDayEditSchema = z.object({
  dayName: z.string().min(1, "Day name is required"),
  dayNumber: z.coerce.number().int().min(1),
  description: z.string().min(1, "Description is required"),
  specialInstructions: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  activities: z.array(activitySchema)
});

type TripDayEditFormValues = z.infer<typeof tripDayEditSchema>;
type ActivityFormValues = z.infer<typeof activitySchema>;

export default function EditTripDayPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();

  const [tripDay] = React.useState<TripDay | undefined>(
    mockData.tripDays.find((day) => day.id === id)
  );

  const form = useForm<TripDayEditFormValues>({
    resolver: zodResolver(tripDayEditSchema),
    defaultValues: tripDay ? {
      dayName: tripDay.dayName,
      dayNumber: tripDay.dayNumber,
      description: tripDay.description,
      specialInstructions: tripDay.specialInstructions || "",
      status: tripDay.status,
      activities: tripDay.activities,
    } : {},
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "activities"
  });

  const onSubmit = (data: TripDayEditFormValues) => {
    console.log("Updated Trip Day:", data);
    toast({
      title: "Success!",
      description: `Day ${data.dayNumber}: ${data.dayName} has been updated.`,
    });
    router.push('/dashboard/trip-days');
  };
  
  if (!tripDay) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Trip Day Not Found</h1>
        <p className="text-muted-foreground">The requested trip day could not be found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 text-xl font-semibold">
            Edit Day {tripDay.dayNumber}: {tripDay.dayName}
          </h1>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/trip-days')}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Day Details</CardTitle>
            <CardDescription>Edit the main information for this day.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <FormField control={form.control} name="dayName" render={({ field }) => ( <FormItem><FormLabel>Day Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="dayNumber" render={({ field }) => ( <FormItem><FormLabel>Day Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Day's Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="specialInstructions" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Special Instructions</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
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
                            <p className="font-semibold">{activity.name} <span className="text-xs font-normal text-muted-foreground">({activity.type})</span></p>
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


// Activity Form Modal Component
type ActivityFormModalProps = {
    children: React.ReactNode;
    activity?: ActivityFormValues & {id?: string};
    onSave: (data: ActivityFormValues) => void;
}

const defaultActivityValues: ActivityFormValues = {
  name: "",
  type: "sightseeing",
  time: "",
  duration: "",
  location: "",
  price: 0,
  priceIncluded: true,
  bookingRequired: false,
  description: "",
};

function ActivityFormModal({ children, activity, onSave }: ActivityFormModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const activityForm = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema),
        defaultValues: activity || defaultActivityValues
    });

    React.useEffect(() => {
        if (isOpen) {
            activityForm.reset(activity || defaultActivityValues);
        }
    }, [isOpen, activity, activityForm]);

    const handleSave = (data: ActivityFormValues) => {
        onSave(data);
        setIsOpen(false);
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                 <Form {...activityForm}>
                    <form onSubmit={activityForm.handleSubmit(handleSave)}>
                        <DialogHeader>
                            <DialogTitle>{activity ? 'Edit' : 'Add'} Activity</DialogTitle>
                            <DialogDescription>Fill in the details for the activity.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={activityForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Activity Name</FormLabel><FormControl><Input placeholder="e.g., Sunset Cruise" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>
                                  <SelectItem value="trekking">Trekking</SelectItem>
                                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                                  <SelectItem value="meal">Meal</SelectItem>
                                  <SelectItem value="transport">Transport</SelectItem>
                                  <SelectItem value="accommodation">Accommodation</SelectItem>
                                  <SelectItem value="adventure">Adventure</SelectItem>
                                  <SelectItem value="shopping">Shopping</SelectItem>
                                  <SelectItem value="leisure">Leisure</SelectItem>
                                  </SelectContent></Select><FormMessage /></FormItem> )} />
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={activityForm.control} name="time" render={({ field }) => ( <FormItem><FormLabel>Time</FormLabel><FormControl><Input placeholder="e.g., 05:00 PM" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="duration" render={({ field }) => ( <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 2 hours" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={activityForm.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Name of the place" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={activityForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the activity" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <div className="grid md:grid-cols-3 gap-4 items-center">
                                <FormField control={activityForm.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="priceIncluded" render={({ field }) => (<FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Price Included</FormLabel></FormItem>)} />
                                <FormField control={activityForm.control} name="bookingRequired" render={({ field }) => (<FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Booking Required</FormLabel></FormItem>)} />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Save Activity</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
