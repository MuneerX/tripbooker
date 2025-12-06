
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
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
import mockData from "@/lib/data"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { TripDay } from "@/lib/types"

const tripDaySchema = z.object({
  dayName: z.string().min(1, "Day name is required"),
  dayNumber: z.coerce.number().int().min(1, "Day number must be at least 1"),
  description: z.string().min(1, "Description is required"),
  specialInstructions: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  tourPackageId: z.string().min(1, "Please select a tour package"),
});

type TripDayFormValues = z.infer<typeof tripDaySchema>;

export default function CreateTripDayPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [createdTripDays, setCreatedTripDays] = React.useState<TripDay[]>([]);

  const form = useForm<TripDayFormValues>({
    resolver: zodResolver(tripDaySchema),
    defaultValues: {
      dayName: "",
      dayNumber: 1,
      description: "",
      specialInstructions: "",
      status: "active",
      tourPackageId: "",
    },
  });

  const onSubmit = (data: TripDayFormValues) => {
    // In a real app, you'd save this to a database
    // For now, we'll just add it to our local state
    const newTripDay: TripDay = {
      ...data,
      id: `day_${Date.now()}`, // Use a more unique ID
      activities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // Mocked fields that are not in the form
      departureLocation: "N/A",
      numberOfStays: 0,
    };
    
    // Add to mockData so edit page can find it
    mockData.tripDays.push(newTripDay);
    setCreatedTripDays(prev => [...prev, newTripDay]);
    
    toast({
      title: "Trip Day Added!",
      description: `${data.dayName} has been added to the list.`,
    });

    // Reset form for the next entry
    form.reset({
      ...form.getValues(),
      dayName: "",
      dayNumber: data.dayNumber + 1,
      description: "",
      specialInstructions: "",
    });
  };

  const handleEdit = (dayId: string) => {
    router.push(`/dashboard/trip-days/edit/${dayId}?from=create`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create New Trip Day</CardTitle>
            <CardDescription>Fill out the details for a single trip day.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="tourPackageId"
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
                          {mockData.tourPackages.map(pkg => (
                            <SelectItem key={pkg.id} value={pkg.id}>{pkg.tourName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dayName" render={({ field }) => ( <FormItem><FormLabel>Day Name</FormLabel><FormControl><Input placeholder="e.g., Arrival" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="dayNumber" render={({ field }) => ( <FormItem><FormLabel>Day No.</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Day's Description</FormLabel><FormControl><Textarea placeholder="Describe the plan for the day..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="specialInstructions" render={({ field }) => ( <FormItem><FormLabel>Special Instructions</FormLabel><FormControl><Textarea placeholder="Any special notes for the traveler?" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="w-48"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Trip Day
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Display Created Days */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Itinerary for {form.watch('tourPackageId') ? mockData.tourPackages.find(p => p.id === form.watch('tourPackageId'))?.tourName : '...'} </CardTitle>
            <CardDescription>Review the trip days you've added. You can manage activities on the edit screen later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdTripDays.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-12 text-center">
                  <h3 className="text-lg font-semibold">No trip days added yet</h3>
                  <p className="text-sm text-muted-foreground">Use the form on the left to start building your itinerary.</p>
              </div>
            ) : (
              createdTripDays.map((day, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Day {day.dayNumber}: {day.dayName}</CardTitle>
                      <CardDescription>Activities: {day.activities.length}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(day.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                       <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setCreatedTripDays(days => days.filter(d => d.id !== day.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{day.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
             {createdTripDays.length > 0 && (
                <>
                <Separator className="my-6"/>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={() => {
                         toast({ title: "Success!", description: "Itinerary saved successfully."});
                         router.push('/dashboard/trip-days');
                    }}>Save Itinerary</Button>
                </div>
                </>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
