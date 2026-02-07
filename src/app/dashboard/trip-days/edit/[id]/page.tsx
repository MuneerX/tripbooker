
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
import { ArrowLeft, PlusCircle, Trash2, DollarSign, CheckCircle, XCircle, AlertTriangle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTripDayById, updateTripDay, getTripDaysForPackage, getTourPackages, getTripLocations } from "@/lib/supabase/queries";
import { ActivityFormModal, activitySchema } from "@/app/dashboard/trip-days/create/_components/ActivityFormModal";
import { formatCurrency } from "@/lib/utils";
import type { TripDay, TourPackage, TripLocation } from "@/lib/types";
import { useBreadcrumb } from "../../../layout";
import Link from "next/link";
import { Combobox } from "@/components/ui/combobox";

const tripDayEditSchema = z.object({
  day_name: z.string().min(1, "Day name is required"),
  day_number: z.coerce.number().int().min(1),
  description: z.string().min(1, "Description is required"),
  activities: z.array(activitySchema).optional(),
  title: z.string().min(1, "Title is required"),
  meals_included: z.array(z.string()).optional(),
  package_id: z.string().min(1, "Please select a tour package."),
});

type TripDayEditFormValues = z.infer<typeof tripDayEditSchema>;

export default function EditTripDayPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();

  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [existingDayNumbers, setExistingDayNumbers] = React.useState<number[]>([]);
  const [originalDayNumber, setOriginalDayNumber] = React.useState<number | null>(null);
  const [tourPackages, setTourPackages] = React.useState<TourPackage[]>([]);
  const [locations, setLocations] = React.useState<TripLocation[]>([]);
  const [selectedPackage, setSelectedPackage] = React.useState<TourPackage | null>(null);

  const formSchema = tripDayEditSchema.superRefine(({ day_number, package_id }, ctx) => {
    const isOriginalPackage = package_id === form.getValues('package_id');
    
    if (!isOriginalPackage || day_number !== originalDayNumber) {
      if (existingDayNumbers.includes(day_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "This day number already exists for this package.",
          path: ["day_number"],
        });
      }
    }

    if (selectedPackage && day_number > selectedPackage.days) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Day number cannot exceed the total days (${selectedPackage.days}) for this package.`,
        path: ["day_number"],
      });
    }
  });
  
  const form = useForm<TripDayEditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        day_name: "",
        day_number: 1,
        description: "",
        title: "",
        meals_included: [],
        activities: [],
        package_id: "",
    },
  });

  const selectedPackageId = form.watch("package_id");

  React.useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        
        const [packages, locs] = await Promise.all([getTourPackages(), getTripLocations()]);
        setTourPackages(packages);
        setLocations(locs);

        if (id) {
            const day = await getTripDayById(id);
            if (day && day.package_id) {
                const selectedPkg = packages.find(p => p.id === day.package_id);
                setSelectedPackage(selectedPkg || null);

                const existingDays = await getTripDaysForPackage(day.package_id);
                setExistingDayNumbers(existingDays.map(d => d.day_number));
                setOriginalDayNumber(day.day_number);
                setBreadcrumbName(`Edit: ${day.day_name}`);

                form.reset({
                    day_name: day.day_name || '',
                    day_number: day.day_number,
                    description: day.description || '',
                    title: day.title || '',
                    meals_included: day.meals_included || [],
                    package_id: day.package_id,
                    activities: (day.activities || []).map(act => ({
                    ...act,
                    activity_time: act.activity_time ? act.activity_time : "00:00:00",
                    description: act.description ?? '',
                    special_instructions: act.special_instructions ?? '',
                    }))
                });
            } else {
                toast({ variant: "destructive", title: "Error", description: "Trip Day not found or is not associated with a package." });
                router.push('/dashboard/trip-days');
            }
        }
        setLoading(false);
    };
    fetchInitialData();
    
     // Clear on unmount
    return () => setBreadcrumbName('');
  }, [id, router, toast, form, setBreadcrumbName]);

  React.useEffect(() => {
    const fetchDaysForSelectedPackage = async () => {
      const selectedPkg = tourPackages.find(p => p.id === selectedPackageId);
      setSelectedPackage(selectedPkg || null);
      if (selectedPackageId) {
        const existingDays = await getTripDaysForPackage(selectedPackageId);
        setExistingDayNumbers(existingDays.map(day => day.day_number));
        form.trigger("day_number"); // Re-trigger validation for day_number
      }
    };
    fetchDaysForSelectedPackage();
  }, [selectedPackageId, form, tourPackages]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "activities"
  });
  
  const findLocationName = (placeId?: string | null) => {
    if (!placeId) return null;
    return locations.find(loc => loc.id === placeId)?.name || null;
  };


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
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="package_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour Package <span className="text-destructive">*</span></FormLabel>
                   <FormControl>
                      <Combobox
                        options={tourPackages.map(pkg => ({ value: pkg.id, label: pkg.name }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a tour package"
                        searchPlaceholder="Search packages..."
                        emptyText="No package found."
                      />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="day_name" render={({ field }) => ( <FormItem><FormLabel>Day Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="day_number" render={({ field }) => ( <FormItem><FormLabel>Day Number <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem className="lg:col-span-3"><FormLabel>Title <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem className="lg:col-span-3"><FormLabel>Day's Description <span className="text-destructive">*</span></FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
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
                            
                            {activity.activity_type === 'explore' ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    {activity.special_instructions && (
                                        <div className="flex items-center text-sm gap-2 mt-2 text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            <span>Location: {activity.special_instructions}</span>
                                        </div>
                                    )}
                                </>
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
                                activity={fields[index]}
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
