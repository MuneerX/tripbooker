"use client"

import * as React from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import mockData from "@/lib/data"
import { PlusCircle, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const activitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  type: z.enum(["trekking", "sightseeing", "meal", "transport", "accommodation", "adventure", "shopping"]),
  locationId: z.string().min(1, "Location is required"),
  time: z.string().min(1, "Time is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  priceIncluded: z.boolean().default(false),
  bookingRequired: z.boolean().default(false),
});

const tripDaySchema = z.object({
  dayName: z.string().min(1, "Day name is required"),
  dayNumber: z.coerce.number().int().min(1, "Day number must be at least 1"),
  tourPackageId: z.string().min(1, "Please select a tour package"),
  description: z.string().min(1, "Description is required"),
  specialInstructions: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  activities: z.array(activitySchema).min(1, "At least one activity is required."),
});

type TripDayFormValues = z.infer<typeof tripDaySchema>;

export default function CreateTripDayPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TripDayFormValues>({
    resolver: zodResolver(tripDaySchema),
    defaultValues: {
      dayName: "",
      dayNumber: 1,
      description: "",
      status: "active",
      activities: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "activities",
  });

  const onSubmit = (data: TripDayFormValues) => {
    console.log(data);
    toast({
      title: "Success!",
      description: "New trip day has been created.",
    });
    router.push('/dashboard/trip-days');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Trip Day</CardTitle>
        <CardDescription>Fill out the details for the new trip day itinerary.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Day Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="tourPackageId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Associate with Tour Package</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a tour package" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {mockData.tourPackages.map(pkg => (
                                <SelectItem key={pkg.id} value={pkg.id}>{pkg.tourName}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="dayName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Day Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Arrival in Paris" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dayNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Day Number</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="e.g., 1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Day's Itinerary Description</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Describe the plan for the day..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="specialInstructions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Special Instructions</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Any special notes for the traveler? (e.g., 'Wear comfortable shoes')" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Activities</CardTitle>
                        <CardDescription>Add activities for this trip day.</CardDescription>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ name: "", type: "sightseeing", locationId: "", time: "", description: "", price: 0, priceIncluded: false, bookingRequired: false })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Activity
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {form.formState.errors.activities?.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.activities.root.message}</p>
                    )}
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                           
                           <FormField
                                control={form.control}
                                name={`activities.${index}.name`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activity Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Eiffel Tower Visit" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`activities.${index}.type`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="trekking">Trekking</SelectItem>
                                                <SelectItem value="sightseeing">Sightseeing</SelectItem>
                                                <SelectItem value="meal">Meal</SelectItem>
                                                <SelectItem value="transport">Transport</SelectItem>
                                                <SelectItem value="accommodation">Accommodation</SelectItem>
                                                <SelectItem value="adventure">Adventure</SelectItem>
                                                <SelectItem value="shopping">Shopping</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`activities.${index}.locationId`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {mockData.tripLocations.map(loc => (
                                                    <SelectItem key={loc.id} value={loc.id}>{loc.locationName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`activities.${index}.time`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., 09:00 AM" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name={`activities.${index}.description`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Activity details..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 items-center gap-4">
                                <FormField
                                    control={form.control}
                                    name={`activities.${index}.price`}
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="e.g., 25" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`activities.${index}.priceIncluded`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-end space-x-3 space-y-0 pt-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Price Included in Package</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`activities.${index}.bookingRequired`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-end space-x-3 space-y-0 pt-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="font-normal">Booking Required</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>

                        </div>
                    ))}
                </CardContent>
            </Card>
            
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Create Trip Day</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
