
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Upload } from "lucide-react"
import { createTripLocation } from "@/lib/supabase/queries"
import { Switch } from "@/components/ui/switch"

const tripLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  place_type: z.string().min(1, "Place type is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  code: z.string().min(1, "Location code is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  is_active: z.boolean().default(true),
});

type TripLocationFormValues = z.infer<typeof tripLocationSchema>;

export default function CreateTripLocationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TripLocationFormValues>({
    resolver: zodResolver(tripLocationSchema),
    defaultValues: {
      name: "",
      place_type: "destination",
      city: "",
      country: "India",
      state: "",
      district: "",
      code: "",
      description: "",
      address: "",
      is_active: true,
      latitude: null,
      longitude: null,
    },
  });

  const onSubmit = async (data: TripLocationFormValues) => {
    setIsSubmitting(true);
    try {
      // NOTE: image_urls are not handled in this form for now.
      await createTripLocation({ ...data, image_urls: [] });
      toast({
        title: "Success!",
        description: "New trip location has been created.",
      });
      router.push('/dashboard/trip-locations');
      router.refresh();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not create the location.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Trip Location</h1>
            <p className="text-muted-foreground">Add a new location to be used in trip itineraries.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="name"
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
                            name="place_type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Location Type</FormLabel>
                                 <FormControl>
                                    <Input placeholder="e.g., destination" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Île-de-France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="district" render={({ field }) => (<FormItem><FormLabel>District</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" placeholder="e.g., 48.8584" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" placeholder="e.g., 2.2945" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="md:col-span-2 flex items-end gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormLabel>Location Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., PAR-EFL" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Place Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="A brief description of the location." {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Full address of the location." {...field} rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active Status</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Location'}
                </Button>
            </div>
          </form>
        </Form>
    </div>
  )
}
