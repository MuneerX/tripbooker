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

const tripDaySchema = z.object({
  dayName: z.string().min(1, "Day name is required"),
  dayNumber: z.coerce.number().int().min(1, "Day number must be at least 1"),
  tourPackageId: z.string().min(1, "Please select a tour package"),
  description: z.string().min(1, "Description is required"),
  specialInstructions: z.string().optional(),
  status: z.enum(["active", "inactive"]),
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
    },
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