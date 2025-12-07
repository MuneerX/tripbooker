
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
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
import { uploadTourImages } from "@/lib/supabase/queries"
import { Upload, File as FileIcon, X } from "lucide-react"

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const tourPackageSchema = z.object({
  name: z.string().min(1, "Tour name is required"),
  package_type: z.enum(["World", "India", "Kerala"]),
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
  
  image_files: z.any()
    .refine((files) => files?.length >= 1, "At least one gallery image is required.")
    .refine((files) => Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Max file size is 2MB.`)
    .refine(
      (files) => Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  featured_image_file: z.any()
    .optional()
});

type TourPackageFormValues = z.infer<typeof tourPackageSchema>;

export default function CreateTourPackagePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TourPackageFormValues>({
    resolver: zodResolver(tourPackageSchema),
    defaultValues: {
      name: "",
      package_type: "India",
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
    },
  });
  
  const imageFiles = form.watch("image_files");

  const handleRemoveImage = (indexToRemove: number) => {
    const currentFiles = form.getValues("image_files");
    const newFiles = Array.from(currentFiles).filter((_, index) => index !== indexToRemove);
    
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file as File));

    form.setValue("image_files", dataTransfer.files, { shouldValidate: true });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    const currentFiles = Array.from(form.getValues("image_files") || []);
    
    const combinedFiles = [...currentFiles, ...newFiles];

    const dataTransfer = new DataTransfer();
    combinedFiles.forEach(file => dataTransfer.items.add(file as File));
    
    field.onChange(dataTransfer.files);
  };


  const onSubmit = async (data: TourPackageFormValues) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'image_files' || key === 'featured_image_file') {
        // Skip file fields for now
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    if (data.image_files) {
        Array.from(data.image_files).forEach((file: any) => {
            formData.append('image_files', file);
        });
    }

    if (data.featured_image_file && data.featured_image_file.length > 0) {
        formData.append('featured_image_file', data.featured_image_file[0]);
    }

    try {
      await uploadTourImages(formData);
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
                                <FormField control={form.control} name="package_type" render={({ field }) => ( <FormItem><FormLabel>Tour Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="World">World</SelectItem><SelectItem value="India">India</SelectItem><SelectItem value="Kerala">Kerala</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
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
                             <FormField
                                control={form.control}
                                name="image_files"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tour Gallery Images</FormLabel>
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
                                 <FormField
                                    control={form.control}
                                    name="featured_image_file"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Featured Image</FormLabel>
                                        <FormControl>
                                            <Input type="file" accept="image/*"
                                                onChange={(e) => field.onChange(e.target.files)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
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

    