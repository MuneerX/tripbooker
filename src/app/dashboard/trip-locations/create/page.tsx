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

const tripLocationSchema = z.object({
  locationName: z.string().min(1, "Location name is required"),
  type: z.enum(["city", "landmark", "nature", "heritage", "beach", "mountain"]),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["active", "inactive"]),
});

type TripLocationFormValues = z.infer<typeof tripLocationSchema>;

export default function CreateTripLocationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TripLocationFormValues>({
    resolver: zodResolver(tripLocationSchema),
    defaultValues: {
      locationName: "",
      type: "city",
      city: "",
      country: "",
      description: "",
      status: "active",
    },
  });

  const onSubmit = (data: TripLocationFormValues) => {
    console.log(data);
    toast({
      title: "Success!",
      description: "New trip location has been created.",
    });
    router.push('/dashboard/trip-locations');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Trip Location</CardTitle>
        <CardDescription>Add a new location to be used in trip itineraries.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Eiffel Tower" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="landmark">Landmark</SelectItem>
                          <SelectItem value="nature">Nature</SelectItem>
                          <SelectItem value="heritage">Heritage</SelectItem>
                          <SelectItem value="beach">Beach</SelectItem>
                          <SelectItem value="mountain">Mountain</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Paris" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., France" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the location." {...field} />
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
                <Button type="submit">Create Location</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}