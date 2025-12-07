

"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { createTourPackage } from "@/lib/supabase/queries"

const tourPackageSchema = z.object({
  name: z.string().min(1, "Tour name is required"),
  package_type: z.enum(["domestic", "international", "World", "India", "Kerala"]),
  category: z.enum(["Adventure", "Leisure", "Pilgrimage", "Cultural", "Wildlife", "Family", "Premium", "LadiesOnly"]),
  base_price: z.coerce.number().min(0, "Price must be a positive number"),
  days: z.coerce.number().int().min(1, "Must be at least 1 day"),
  nights: z.coerce.number().int().min(0, "Nights cannot be negative"),
  max_guests: z.coerce.number().int().min(1, "Must be at least 1"),
  
  description: z.string().min(1, "Description is required"),
  inclusion: z.string().min(1, "Inclusions are required"),
  exclusion: z.string().min(1, "Exclusions are required"),
  booking_policy: z.string().optional(),
  cancellation_policy: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  
  image_urls: z.string().min(1, "At least one image URL is required"),
  featured_image_url: z.string().url().optional().or(z.literal('')),
});

type TourPackageFormValues = z.infer<typeof tourPackageSchema>;

export default function CreateTourPackagePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TourPackageFormValues>({
    resolver: zodResolver(tourPackageSchema),
    defaultValues: {
      name: "",
      package_type: "domestic",
      category: "Leisure",
      base_price: 0,
      days: 1,
      nights: 0,
      max_guests: 10,
      description: "",
      inclusion: "",
      exclusion: "",
      booking_policy: "",
      cancellation_policy: "",
      terms_and_conditions: "",
      is_featured: false,
      is_active: true,
      image_urls: "https://picsum.photos/seed/default/600/400",
      featured_image_url: "",
    },
  });

  const onSubmit = async (data: TourPackageFormValues) => {
    const formattedData = {
        ...data,
        image_urls: data.image_urls.split(',').map(s => s.trim()).filter(Boolean),
        // Fields from old schema that are not in the new one but might be expected by DB (with defaults)
        itineraryId: "itin_default",
        payInParts: [],
        highlights: [], // No longer in form, send empty array
    };
    
    // remove fields that are not in the database schema from the old implementation
    const { withdrawalDate, introductionDate, ...restOfData } = formattedData as any;


    try {
      await createTourPackage(restOfData);
      toast({
        title: "Success!",
        description: "New tour package has been created.",
      });
      router.push('/dashboard/tour-packages');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not create the tour package.",
      });
    }
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Tour Package</h1>
            <p className="text-muted-foreground">Add a new tour package to your catalog.</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Tour Name</FormLabel><FormControl><Input placeholder="e.g., Himalayan Adventure" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="package_type" render={({ field }) => ( <FormItem><FormLabel>Tour Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="domestic">Domestic</SelectItem><SelectItem value="international">International</SelectItem><SelectItem value="World">World</SelectItem><SelectItem value="India">India</SelectItem><SelectItem value="Kerala">Kerala</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Adventure">Adventure</SelectItem><SelectItem value="Leisure">Leisure</SelectItem><SelectItem value="Pilgrimage">Pilgrimage</SelectItem><SelectItem value="Cultural">Cultural</SelectItem><SelectItem value="Wildlife">Wildlife</SelectItem><SelectItem value="Family">Family</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="LadiesOnly">Ladies Only</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="days" render={({ field }) => ( <FormItem><FormLabel>Days</FormLabel><FormControl><Input type="number" placeholder="e.g., 7" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="nights" render={({ field }) => ( <FormItem><FormLabel>Nights</FormLabel><FormControl><Input type="number" placeholder="e.g., 6" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="base_price" render={({ field }) => ( <FormItem><FormLabel>Base Price (USD)</FormLabel><FormControl><Input type="number" placeholder="e.g., 1200" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="max_guests" render={({ field }) => ( <FormItem><FormLabel>Maximum Guests</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                            <FormItem>
                                <FormLabel>Tour Gallery Image URLs</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="https://example.com/image1.png, https://example.com/image2.png" {...form.register('image_urls')} />
                                </FormControl>
                                <FormDescription>Enter image URLs, separated by commas.</FormDescription>
                            </FormItem>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Tour Information</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Tour Description</FormLabel><FormControl><Textarea placeholder="A detailed description of the tour package." {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="inclusion" render={({ field }) => ( <FormItem><FormLabel>Inclusions</FormLabel><FormControl><Textarea placeholder="e.g., Accommodation, Meals, Guide, ..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="exclusion" render={({ field }) => ( <FormItem><FormLabel>Exclusions</FormLabel><FormControl><Textarea placeholder="e.g., International flights, Visa fees, ..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="booking_policy" render={({ field }) => ( <FormItem><FormLabel>Booking Policies</FormLabel><FormControl><Textarea placeholder="Define the booking policies." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="cancellation_policy" render={({ field }) => ( <FormItem><FormLabel>Cancellation Policies</FormLabel><FormControl><Textarea placeholder="Define the cancellation policies." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="terms_and_conditions" render={({ field }) => ( <FormItem><FormLabel>Terms and Conditions</FormLabel><FormControl><Textarea placeholder="Define the terms and conditions." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Status & Visibility</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="is_featured" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Featured Package</FormLabel><FormDescription>Display this package prominently.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            {form.watch('is_featured') && (
                                <FormItem>
                                    <FormLabel>Featured Image URL</FormLabel>
                                    <FormControl>
                                       <Input placeholder="https://example.com/featured-image.png" {...form.register('featured_image_url')} />
                                    </FormControl>
                                </FormItem>
                            )}
                             <FormField control={form.control} name="is_active" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Active Package</FormLabel><FormDescription>Make this package available for booking.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                        </CardContent>
                    </Card>
                </div>
                </div>
                
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Creating..." : "Create Package"}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  )
}
