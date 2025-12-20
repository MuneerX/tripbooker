

"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Trash2, MapPin, AlertTriangle, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { createTripDay, getTourPackages, getTripDaysForPackage, getTripLocations } from "@/lib/supabase/queries"
import type { TourPackage, TripLocation } from "@/lib/types"
import { ActivityFormModal, activitySchema } from "./_components/ActivityFormModal"
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";


const tripDaySchema = z.object({
  day_name: z.string().min(1, "Day name is required"),
  day_number: z.coerce.number().int().min(1, "Day number must be at least 1"),
  description: z.string().min(1, "Description is required"),
  package_id: z.string().min(1, "Please select a tour package"),
  activities: z.array(activitySchema).optional(),
  title: z.string().optional(),
  meals_included: z.array(z.string()).optional(),
});

type TripDayFormValues = z.infer<typeof tripDaySchema>;

export default function CreateTripDayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tourPackages, setTourPackages] = React.useState<TourPackage[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [existingDayNumbers, setExistingDayNumbers] = React.useState<number[]>([]);
  const [locations, setLocations] = React.useState<TripLocation[]>([]);


  React.useEffect(() => {
    const fetchPackagesAndLocations = async () => {
      const [packages, locs] = await Promise.all([getTourPackages(), getTripLocations()]);
      setTourPackages(packages);
      setLocations(locs);
    };
    fetchPackagesAndLocations();
  }, []);

  const formSchema = tripDaySchema.superRefine(({ day_number }, ctx) => {
    if (existingDayNumbers.includes(day_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This day number already exists for the selected package.",
        path: ["day_number"],
      });
    }
  });


  const form = useForm<TripDayFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day_name: "",
      day_number: 1,
      description: "",
      package_id: "",
      activities: [],
      title: "",
      meals_included: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "activities"
  });

  const selectedPackageId = form.watch("package_id");

  React.useEffect(() => {
    const setNextDayNumber = async () => {
      if (selectedPackageId) {
        const existingDays = await getTripDaysForPackage(selectedPackageId);
        const days = existingDays.map(day => day.day_number);
        setExistingDayNumbers(days);
        
        let nextDay = 1;
        while (days.includes(nextDay)) {
            nextDay++;
        }
        form.setValue("day_number", nextDay);
        form.trigger("day_number"); // Re-trigger validation
      } else {
        setExistingDayNumbers([]);
      }
    };
    setNextDayNumber();
  }, [selectedPackageId, form]);

  const onSubmit = async (data: TripDayFormValues) => {
    setIsSubmitting(true);
    try {
      await createTripDay(data);
      toast({
        title: "Success!",
        description: `Trip Day "${data.day_name}" has been created.`,
      });
      router.push('/dashboard/trip-days');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not create the trip day.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPackageName = form.watch('package_id') 
    ? tourPackages.find(p => p.id === form.watch('package_id'))?.name 
    : '...';
    
   const findLocationName = (placeId?: string | null) => {
    if (!placeId) return null;
    return locations.find(loc => loc.id === placeId)?.name || null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Trip Day</h1>
        <p className="text-muted-foreground">Fill out the details for a single trip day and add its activities.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Trip Day Form */}
            <div className="lg:col-span-1">
                <Card>
                <CardHeader>
                    <CardTitle>Trip Day Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="package_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tour Package</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tour package" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {tourPackages.map(pkg => (
                                    <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="day_name" render={({ field }) => ( <FormItem><FormLabel>Day Name</FormLabel><FormControl><Input placeholder="e.g., Arrival in Paris" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="day_number" render={({ field }) => ( <FormItem><FormLabel>Day No.</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., City Exploration" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Day's Description</FormLabel><FormControl><Textarea placeholder="Describe the plan for the day..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                </CardContent>
                </Card>
            </div>

            {/* Right Column: Activities */}
            <div className="lg:col-span-2">
                <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Activities for Itinerary: {selectedPackageName}</CardTitle>
                        <CardDescription>Add and manage activities for this trip day.</CardDescription>
                    </div>
                    <ActivityFormModal onSave={(newActivity) => append(newActivity)}>
                        <Button type="button" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Activity
                        </Button>
                    </ActivityFormModal>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-12 text-center">
                        <h3 className="text-lg font-semibold">No activities added yet</h3>
                        <p className="text-sm text-muted-foreground">Click "Add Activity" to start building your itinerary.</p>
                    </div>
                    ) : (
                    fields.map((activity, index) => (
                        <Card key={activity.id} className="bg-muted/30 p-4">
                           <div className="flex justify-between items-start">
                                <div className="grid gap-2 flex-1">
                                    <div className="flex justify-between">
                                        <p className="font-semibold">{activity.title} <span className="text-xs font-normal text-muted-foreground capitalize">({activity.activity_type})</span></p>
                                        <p className="text-sm text-muted-foreground">{activity.activity_time ? activity.activity_time.substring(0,5) : ''} &bull; {activity.duration_minutes} mins</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{activity.description}</p>

                                    {activity.place_id && findLocationName(activity.place_id) && (
                                        <div className="flex items-center text-sm gap-2 mt-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>Location: <Link href={`/dashboard/trip-locations/${activity.place_id}`} className="underline hover:text-primary ml-1">{findLocationName(activity.place_id)}</Link></span>
                                        </div>
                                    )}
                                    
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
                                        {Number(activity.additional_cost) > 0 && (
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
                    )}
                </CardContent>
                </Card>
            </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Trip Day"}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  )
}
