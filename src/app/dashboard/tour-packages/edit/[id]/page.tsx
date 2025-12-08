
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
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { getTourPackageById, updateTourPackage } from "@/lib/supabase/queries"
import { Upload, File as FileIcon, X, Image as ImageIcon } from "lucide-react"
import type { TourPackage } from "@/lib/types"
import Image from "next/image"
import { PayInPartsForm } from "@/app/dashboard/tour-packages/create/_components/PayInPartsForm"

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const payInPartSchema = z.object({
  id: z.string().optional(),
  package_id: z.string().optional(),
  plan_name: z.string().min(1, "Plan name is required"),
  months: z.coerce.number().int().min(0),
  monthly_payment: z.coerce.number().min(0),
  total_amount: z.coerce.number().min(0),
  processing_fee: z.coerce.number().min(0).optional().nullable(),
});

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
  
  image_urls: z.array(z.string()).optional(),
  featured_image_url: z.string().optional().nullable(),
  
  new_image_files: z.any()
    .optional()
    .refine((files) => !files || Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Max file size is 2MB.`)
    .refine((files) => !files || Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)), ".jpg, .jpeg, .png and .webp files are accepted."),
  
  new_featured_image_file: z.any().optional(),
  pay_in_parts: z.array(payInPartSchema).optional(),
});

type TourPackageFormValues = z.infer<typeof tourPackageSchema>;

export default function EditTourPackagePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const [tourPackage, setTourPackage] = React.useState<TourPackage | null>(null);
  const [loading, setLoading] = React.useState(true);

  const form = useForm<TourPackageFormValues>({
    resolver: zodResolver(tourPackageSchema),
    defaultValues: {},
  });

  const isFeatured = form.watch('is_featured');
  
  React.useEffect(() => {
    if (id) {
      const fetchPackage = async () => {
        setLoading(true);
        const pkg = await getTourPackageById(id);
        if (pkg) {
          setTourPackage(pkg);
          form.reset({
            ...pkg,
            base_price: pkg.base_price ?? 0,
            max_guests: pkg.max_guests ?? 10,
            pay_in_parts: pkg.pay_in_parts || [],
          });
        } else {
          toast({ variant: "destructive", title: "Error", description: "Tour package not found." });
          router.push('/dashboard/tour-packages');
        }
        setLoading(false);
      };
      fetchPackage();
    }
  }, [id, router, toast, form]);

  React.useEffect(() => {
    if (!isFeatured) {
        form.setValue('featured_image_url', null);
        form.setValue('new_featured_image_file', null);
    }
  }, [isFeatured, form]);
  
  const newImageFiles = form.watch("new_image_files");
  const newFeaturedImageFile = form.watch("new_featured_image_file");
  const existingImageUrls = form.watch("image_urls") || [];

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

  const onSubmit = async (data: TourPackageFormValues) => {
    const formData = new FormData();
    
    // Pass original image urls to compare on server for deletion
    if (tourPackage?.image_urls) {
        formData.append('original_image_urls', JSON.stringify(tourPackage.image_urls));
    }
    if (tourPackage?.featured_image_url) {
        formData.append('original_featured_image_url', tourPackage.featured_image_url);
    }

    // Append all other form data
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'new_image_files' || key === 'new_featured_image_file' || key === 'image_urls' || key === 'featured_image_url' || key === 'pay_in_parts') {
        // Handled separately
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (data.pay_in_parts) {
      formData.append('pay_in_parts', JSON.stringify(data.pay_in_parts));
    }

    // Append new image files
    if (data.new_image_files) {
        Array.from(data.new_image_files).forEach((file: any) => {
            formData.append('new_image_files', file);
        });
    }
    if (data.new_featured_image_file && data.new_featured_image_file.length > 0) {
        formData.append('new_featured_image_file', data.new_featured_image_file[0]);
    }

    // Append remaining existing image urls
    formData.append('image_urls', JSON.stringify(data.image_urls || []));
    formData.append('featured_image_url', data.featured_image_url || '');

    try {
      await updateTourPackage(id, formData);
      toast({
        title: "Success!",
        description: "Tour package has been updated.",
      });
      router.push('/dashboard/tour-packages');
      router.refresh();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not update the tour package.",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!tourPackage) {
    return <div>Package not found.</div>
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Tour Package</h1>
            <p className="text-muted-foreground">Modify the details of your tour package.</p>
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
                                <FormField control={form.control} name="package_type" render={({ field }) => ( <FormItem><FormLabel>Tour Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="World">World</SelectItem><SelectItem value="India">India</SelectItem><SelectItem value="Kerala">Kerala</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Adventure">Adventure</SelectItem><SelectItem value="Leisure">Leisure</SelectItem><SelectItem value="Pilgrimage">Pilgrimage</SelectItem><SelectItem value="Cultural">Cultural</SelectItem><SelectItem value="Wildlife">Wildlife</SelectItem><SelectItem value="Family">Family</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="LadiesOnly">Ladies Only</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
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
                                name="new_image_files"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tour Gallery Images</FormLabel>
                                    <div className="space-y-4">
                                        {/* Existing Images */}
                                        {existingImageUrls.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Current Images:</h4>
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
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Pay in Parts</CardTitle><CardDescription>Define payment plans for this package.</CardDescription></CardHeader>
                        <CardContent>
                            <PayInPartsForm />
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
                                    name="new_featured_image_file"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Featured Image</FormLabel>
                                        {form.getValues("featured_image_url") && !newFeaturedImageFile && (
                                             <div className="relative group w-48">
                                                <Image src={form.getValues("featured_image_url")!} alt="Featured image" width={192} height={108} className="rounded-md object-cover" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => form.setValue("featured_image_url", "", { shouldValidate: true })}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <label htmlFor="featured-image-file" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer shadow-sm">
                                                    Choose New File
                                                </label>
                                                <Input 
                                                    id="featured-image-file"
                                                    type="file" 
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => field.onChange(e.target.files)}
                                                />
                                                {newFeaturedImageFile && newFeaturedImageFile.length > 0 ? (
                                                    <div className="flex items-center justify-between p-2 bg-muted rounded-md flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium truncate max-w-xs">{newFeaturedImageFile[0].name}</span>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => form.setValue("new_featured_image_file", null, { shouldValidate: true })}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : <span className="text-sm text-muted-foreground">No new file selected.</span>}
                                            </div>
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
                        {form.formState.isSubmitting ? "Updating..." : "Update Package"}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  )
}

    