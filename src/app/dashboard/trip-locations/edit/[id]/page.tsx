

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
import { useToast } from "@/hooks/use-toast";
import { MapPin, Upload, ArrowLeft, File as FileIcon, X } from "lucide-react";
import { getTripLocationById, updateTripLocation } from "@/lib/supabase/queries";
import type { TripLocation } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


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
  image_urls: z.array(z.string()).optional(),
  new_image_files: z.any()
    .optional()
    .refine((files) => !files || Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Max file size is 2MB.`)
    .refine((files) => !files || Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)), ".jpg, .jpeg, .png and .webp files are accepted."),
});

type TripLocationFormValues = z.infer<typeof tripLocationSchema>;

const locationTypeOptions = [
    "Tourist Places",
    "National Parks",
    "Beaches",
    "Mountain and Hiking Trails",
    "Lakes and Rivers",
    "Museums and Galleries",
    "Historical Landmarks",
    "Temples, Churches & Mosques",
    "UNESCO World Heritage Sites",
    "Major Cities",
    "Shopping Districts",
    "Entertainment Zones",
    "Local Markets",
    "Theme/Amusement Parks",
    "Adventure Sports Location",
    "Wildlife Reserves",
    "Zoo and Aquarium",
    "Food Markets",
    "Famous Restaurants",
    "Street Food Area",
    "Spas and Wellness Retreats",
    "Beach Resorts",
    "Countryside Retreats",
    "Yoga Centers",
    "Cultural Festivals",
    "Music and Art Festivals",
    "Seasonal Events",
    "Sporting Events",
];

export default function EditTripLocationPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [originalLocation, setOriginalLocation] = React.useState<TripLocation | null>(null);

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
          setOriginalLocation(loc);
          form.reset({
            name: loc.name,
            place_type: loc.place_type || 'Tourist Places',
            city: loc.city || '',
            country: loc.country || 'India',
            latitude: loc.latitude,
            longitude: loc.longitude,
            state: loc.state || '',
            district: loc.district || '',
            code: loc.code || '',
            description: loc.description || '',
            address: loc.address || '',
            is_active: loc.is_active || false,
            image_urls: loc.image_urls || [],
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

  const newImageFiles = form.watch("new_image_files");
  const existingImageUrls = form.watch("image_urls") || [];

    const handlePickFromMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("latitude", latitude);
          form.setValue("longitude", longitude);
          toast({
            title: "Location Fetched!",
            description: `Latitude and Longitude have been set to your current location.`,
          });
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Could not fetch location",
            description: error.message || "Please ensure you have granted location permissions.",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation.",
      });
    }
  };


  const handleRemoveExistingImage = (urlToRemove: string) => {
    const updatedUrls = existingImageUrls.filter(url => url !== urlToRemove);
    form.setValue("image_urls", updatedUrls, { shouldValidate: true });
  };
  
  const handleRemoveNewImage = (indexToRemove: number) => {
    const currentFiles = form.getValues("new_image_files");
    if (!currentFiles) return;
    const newFiles = Array.from(currentFiles).filter((_, index) => index !== indexToRemove);
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file as File));
    form.setValue("new_image_files", dataTransfer.files, { shouldValidate: true });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const filesToAdd = Array.from(e.target.files || []);
    if (filesToAdd.length === 0) return;
    const currentFiles = Array.from(form.getValues("new_image_files") || []);
    const combinedFiles = [...currentFiles, ...filesToAdd];
    const dataTransfer = new DataTransfer();
    combinedFiles.forEach(file => dataTransfer.items.add(file as File));
    field.onChange(dataTransfer.files);
  };


  const onSubmit = async (data: TripLocationFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();

    if (originalLocation?.image_urls) {
        formData.append('original_image_urls', JSON.stringify(originalLocation.image_urls));
    }
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'new_image_files' || key === 'image_urls') {
        // Handled separately
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (data.new_image_files) {
        Array.from(data.new_image_files).forEach((file: any) => {
            formData.append('new_image_files', file);
        });
    }

    formData.append('image_urls', JSON.stringify(data.image_urls || []));
    
    try {
      await updateTripLocation(id, formData);
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
  
  const originalLocationName = form.getValues('name');

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
                  <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Eiffel Tower" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField
                        control={form.control}
                        name="place_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a location type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {locationTypeOptions.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                  <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Île-de-France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="district" render={({ field }) => (<FormItem><FormLabel>District</FormLabel><FormControl><Input placeholder="e.g., Paris" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., France" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormField control={form.control} name="latitude" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" placeholder="e.g., 48.8584" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="longitude" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" placeholder="e.g., 2.2945" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="button" variant="outline" onClick={handlePickFromMap}>
                        <MapPin className="mr-2 h-4 w-4" /> Pick Your Location
                    </Button>
                  </div>

                  <FormField control={form.control} name="code" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Location Code</FormLabel><FormControl><Input placeholder="e.g., PAR-EFL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Place Information & Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Place Description</FormLabel><FormControl><Textarea placeholder="A brief description of the location." {...field} rows={5} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Full address of the location." {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                  
                  <FormField
                    control={form.control}
                    name="new_image_files"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location Images</FormLabel>
                        <div className="space-y-4">
                            {/* Existing Images */}
                            {existingImageUrls.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Current Images:</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                    {existingImageUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <Image src={url} alt={`Existing image ${index + 1}`} width={150} height={100} className="rounded-md object-cover" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveExistingImage(url)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            )}

                            {/* New Image Upload */}
                            <FormControl>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="image-files" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">Add new images (MAX. 2MB each)</p>
                                        </div>
                                        <Input id="image-files" type="file" className="hidden" multiple onChange={(e) => handleFileChange(e, field)} />
                                    </label>
                                </div> 
                            </FormControl>
                            <FormMessage />

                            {/* New Images Preview */}
                            {newImageFiles && newImageFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <h4 className="text-sm font-medium">New Files to Upload:</h4>
                                    <div className="grid gap-2 text-sm">
                                        {Array.from(newImageFiles).map((file: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                <div className="flex items-center gap-2">
                                                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium truncate max-w-xs">{file.name}</span>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveNewImage(index)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormItem>
                    )}
                />

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
        </form>
      </Form>
    </div>
  );
}

    