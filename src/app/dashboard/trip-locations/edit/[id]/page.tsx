
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Upload, ArrowLeft } from "lucide-react";
import { getTripLocationById, updateTripLocation } from "@/lib/supabase/queries";
import type { TripLocation } from "@/lib/types";

const tripLocationSchema = z.object({
  locationName: z.string().min(1, "Location name is required"),
  type: z.enum(["city", "landmark", "nature", "heritage", "beach", "mountain"]),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  code: z.string().min(1, "Location code is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  // images: z.any().optional(), // File upload handling is complex
  status: z.enum(["active", "inactive"]),
});

type TripLocationFormValues = z.infer<typeof tripLocationSchema>;

export default function EditTripLocationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TripLocationFormValues>({
    resolver: zodResolver(tripLocationSchema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (id) {
      const fetchLocation = async () => {
        setLoading(true);
        const loc = await getTripLocationById(id);
        if (loc) {
          form.reset({
            locationName: loc.locationName,
            type: loc.type,
            city: loc.city,
            country: loc.country,
            latitude: loc.latitude,
            longitude: loc.longitude,
            state: loc.state,
            district: loc.district,
            code: loc.code,
            description: loc.description,
            address: loc.address,
            status: loc.status,
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Location not found." });
          router.push('/dashboard/trip-locations');
        }
        setLoading(false);
      };
      fetchLocation();
    }
  }, [id, router, toast, form]);

  const onSubmit = async (data: TripLocationFormValues) => {
    setIsSubmitting(true);
    try {
      await updateTripLocation(id, data);
      toast({
        title: "Success!",
        description: "Trip location has been updated.",
      });
      router.push('/dashboard/trip-locations');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not update the location.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }
  
  const originalLocationName = form.getValues('locationName');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 text-xl font-semibold">
            Edit Location: {originalLocationName}
          </h1>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" form="location-edit-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

      <Form {...form}>
        <form id="location-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="locationName" render={({ field }) => (<FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Eiffel Tower" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Location Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="city">City</SelectItem><SelectItem value="landmark">Landmark</SelectItem><SelectItem value="nature">Nature</SelectItem><SelectItem value="heritage">Heritage</SelectItem><SelectItem value="beach">Beach</SelectItem><SelectItem value="mountain">Mountain</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Île-de-France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="district" render={({ field }) => (<FormItem><FormLabel>District</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" placeholder="e.g., 48.8584" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" placeholder="e.g., 2.2945" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="md:col-span-2 flex items-end gap-4">
                    <FormField control={form.control} name="code" render={({ field }) => (<FormItem className="flex-grow"><FormLabel>Location Code</FormLabel><FormControl><Input placeholder="e.g., PAR-EFL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="outline"><MapPin className="mr-2 h-4 w-4" /> Pick from map</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Place Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Place Description</FormLabel><FormControl><Textarea placeholder="A brief description of the location." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Full address of the location." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                  <FormItem>
                    <FormLabel>Upload Images</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                          </div>
                          <Input id="dropzone-file" type="file" className="hidden" multiple />
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                  <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
