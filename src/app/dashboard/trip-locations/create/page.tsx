
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
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Upload, File as FileIcon, X } from "lucide-react"
import { createTripLocationWithImages } from "@/lib/supabase/queries"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"

const LocationPicker = dynamic(() => import('./_components/LocationPicker').then(mod => mod.LocationPicker), {
  ssr: false,
  loading: () => (
      <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-80 w-full" />
          <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
          </div>
      </div>
  ),
});


const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const tripLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Location name is required"),
  place_type: z.string().min(1, "Place type is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  code: z.string().min(1, "Location code is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  is_active: z.boolean().default(true),
  image_files: z.any()
    .optional()
    .refine((files) => !files || Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Max file size is 2MB.`)
    .refine(
      (files) => !files || Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  image_urls: z.array(z.string()).optional(),
});


type TripLocationFormValues = z.infer<typeof tripLocationSchema>;

const locationTypeOptions = [
    "Tourist Places", "National Parks", "Beaches", "Mountain and Hiking Trails", "Lakes and Rivers",
    "Museums and Galleries", "Historical Landmarks", "Temples, Churches & Mosques", "UNESCO World Heritage Sites",
    "Major Cities", "Shopping Districts", "Entertainment Zones", "Local Markets", "Theme/Amusement Parks",
    "Adventure Sports Location", "Wildlife Reserves", "Zoo and Aquarium", "Food Markets", "Famous Restaurants",
    "Street Food Area", "Spas and Wellness Retreats", "Beach Resorts", "Countryside Retreats", "Yoga Centers",
    "Cultural Festivals", "Music and Art Festivals", "Seasonal Events", "Sporting Events",
];

export default function CreateTripLocationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TripLocationFormValues>({
    resolver: zodResolver(tripLocationSchema),
    defaultValues: {
      name: "",
      place_type: "Tourist Places",
      city: "",
      country: "India",
      state: "",
      district: "",
      code: "",
      description: "",
      address: "",
      is_active: true,
      latitude: 20.5937, // Default to India center
      longitude: 78.9629,
    },
  });

  const imageFiles = form.watch("image_files");

  const handleRemoveImage = (indexToRemove: number) => {
    const currentFiles = form.getValues("image_files");
    if (!currentFiles) return;
    const newFiles = Array.from(currentFiles).filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file as File));
    form.setValue("image_files", dataTransfer.files, { shouldValidate: true });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const filesToAdd = Array.from(e.target.files || []);
    if (filesToAdd.length === 0) return;
    const currentFiles = Array.from(form.getValues("image_files") || []);
    const combinedFiles = [...currentFiles, ...filesToAdd];
    const dataTransfer = new DataTransfer();
    combinedFiles.forEach(file => dataTransfer.items.add(file as File));
    field.onChange(dataTransfer.files);
  };


  const onSubmit = async (data: TripLocationFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'image_files' && value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (data.image_files) {
      Array.from(data.image_files).forEach((file: any) => {
        formData.append('image_files', file);
      });
    }

    try {
      await createTripLocationWithImages(formData);
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
  
  const initialPosition: [number, number] = [form.watch('latitude') || 20.5937, form.watch('longitude') || 78.9629];

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Trip Location</h1>
            <p className="text-muted-foreground">Add a new location to be used in trip itineraries.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Location Details</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <LocationPicker initialPosition={initialPosition}/>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader>
                        <CardTitle>Place Information</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-6">
                       <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Place Description</FormLabel><FormControl><Textarea placeholder="A brief description of the location." {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField
                            control={form.control}
                            name="image_files"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location Images</FormLabel>
                                  <FormControl>
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="image-files" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 2MB each)</p>
                                            </div>
                                            <Input id="image-files" type="file" className="hidden" multiple
                                                onChange={(e) => handleFileChange(e, field)}
                                            />
                                        </label>
                                    </div> 
                                </FormControl>
                                <FormMessage />
                                {imageFiles && imageFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-medium">Selected Files:</h4>
                                    <div className="grid gap-2 text-sm">
                                    {Array.from(imageFiles).map((file: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium truncate max-w-xs">{file.name}</span>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveImage(index)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                )}
                            </FormItem>
                            )}
                        />
                     </CardContent>
                   </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Eiffel Tower" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="place_type" render={({ field }) => ( <FormItem><FormLabel>Location Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a location type" /></SelectTrigger></FormControl><SelectContent>{locationTypeOptions.map(option => ( <SelectItem key={option} value={option}>{option}</SelectItem> ))}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Île-de-France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="district" render={({ field }) => (<FormItem><FormLabel>District</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="code" render={({ field }) => ( <FormItem><FormLabel>Location Code</FormLabel><FormControl><Input placeholder="e.g., PAR-EFL" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <FormField control={form.control} name="is_active" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel>Active Status</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
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

    