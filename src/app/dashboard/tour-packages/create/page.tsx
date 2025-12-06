
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
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, PlusCircle, Trash2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

const payInPartSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  durationMonths: z.coerce.number().int().min(0),
  price: z.coerce.number().min(0),
})

const tourPackageSchema = z.object({
  tourName: z.string().min(1, "Tour name is required"),
  tourType: z.enum(["domestic", "international"]),
  category: z.enum(["adventure", "leisure", "pilgrimage", "cultural", "wildlife"]),
  basePrice: z.coerce.number().min(0, "Price must be a positive number"),
  days: z.coerce.number().int().min(1, "Must be at least 1 day"),
  nights: z.coerce.number().int().min(0, "Nights cannot be negative"),
  introductionDate: z.date(),
  maxPermittedBooking: z.coerce.number().int().min(1, "Must be at least 1"),
  itineraryId: z.string().min(1, "Itinerary is required"),
  status: z.enum(["active", "inactive"]),
  
  enablePayInParts: z.boolean().default(false),
  payInParts: z.array(payInPartSchema).optional(),

  description: z.string().min(1, "Description is required"),
  highlights: z.string().min(1, "Highlights are required"),
  inclusions: z.string().min(1, "Inclusions are required"),
  exclusions: z.string().min(1, "Exclusions are required"),
  bookingPolicies: z.string().optional(),
  cancellationPolicies: z.string().optional(),
  termsAndConditions: z.string().optional(),
  
  isFeatured: z.boolean().default(false),
});

type TourPackageFormValues = z.infer<typeof tourPackageSchema>;
// Use a different type for the temporary state to allow empty strings
type PayInPartState = {
  partName: string;
  durationMonths: number | '';
  price: number | '';
};

export default function CreateTourPackagePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TourPackageFormValues>({
    resolver: zodResolver(tourPackageSchema),
    defaultValues: {
      tourName: "",
      tourType: "domestic",
      category: "leisure",
      basePrice: 0,
      days: 1,
      nights: 0,
      introductionDate: new Date(),
      maxPermittedBooking: 10,
      itineraryId: "",
      status: "active",
      enablePayInParts: false,
      payInParts: [],
      description: "",
      highlights: "",
      inclusions: "",
      exclusions: "",
      isFeatured: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payInParts"
  });

  const [payInPartData, setPayInPartData] = React.useState<PayInPartState>({
      partName: '',
      durationMonths: '',
      price: ''
  });

  const handleAddPayInPart = () => {
    const { partName, durationMonths, price } = payInPartData;
    // Basic validation before adding
    if (partName && price !== '' && Number(price) > 0) {
        append({
            partName,
            durationMonths: Number(durationMonths) || 0,
            price: Number(price)
        });
        setPayInPartData({ partName: '', durationMonths: '', price: '' }); // Reset form
    } else {
        toast({
            variant: "destructive",
            title: "Invalid Part",
            description: "Please provide a valid name and price for the payment part.",
        })
    }
  };

  const onSubmit = (data: TourPackageFormValues) => {
    // Convert comma-separated strings to arrays
    const formattedData = {
        ...data,
        highlights: data.highlights.split(',').map(s => s.trim()),
        inclusions: data.inclusions.split(',').map(s => s.trim()),
        exclusions: data.exclusions.split(',').map(s => s.trim()),
    };
    console.log(formattedData);
    toast({
      title: "Success!",
      description: "New tour package has been created.",
    });
    router.push('/dashboard/tour-packages');
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Create New Tour Package</CardTitle>
            <CardDescription>Add a new tour package to your catalog.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="tourName" render={({ field }) => ( <FormItem><FormLabel>Tour Name</FormLabel><FormControl><Input placeholder="e.g., Himalayan Adventure" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="tourType" render={({ field }) => ( <FormItem><FormLabel>Tour Type</FormLabel><Select onValuechange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="domestic">Domestic</SelectItem><SelectItem value="international">International</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Category</FormLabel><Select onValuechange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="adventure">Adventure</SelectItem><SelectItem value="leisure">Leisure</SelectItem><SelectItem value="pilgrimage">Pilgrimage</SelectItem><SelectItem value="cultural">Cultural</SelectItem><SelectItem value="wildlife">Wildlife</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="days" render={({ field }) => ( <FormItem><FormLabel>Days</FormLabel><FormControl><Input type="number" placeholder="e.g., 7" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="nights" render={({ field }) => ( <FormItem><FormLabel>Nights</FormLabel><FormControl><Input type="number" placeholder="e.g., 6" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="basePrice" render={({ field }) => ( <FormItem><FormLabel>Base Price (USD)</FormLabel><FormControl><Input type="number" placeholder="e.g., 1200" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="maxPermittedBooking" render={({ field }) => ( <FormItem><FormLabel>Max Guests</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="itineraryId" render={({ field }) => ( <FormItem><FormLabel>Itinerary</FormLabel><Select onValuechange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select itinerary" /></SelectTrigger></FormControl><SelectContent><SelectItem value="itin1">Himalayan Trek Itinerary</SelectItem><SelectItem value="itin2">Goa Beach Itinerary</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="status" render={({ field }) => ( <FormItem><FormLabel>Status</FormLabel><Select onValuechange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={form.control} name="introductionDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Introduction Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                                <FormItem>
                                    <FormLabel>Primary Image</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center justify-center w-full">
                                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                            </div>
                                            <Input id="image-upload" type="file" className="hidden" />
                                        </label>
                                        </div> 
                                    </FormControl>
                                </FormItem>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Pay in Parts</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="enablePayInParts"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Enable Pay in Parts</FormLabel>
                                            <FormDescription>Allow customers to pay in installments.</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            {form.watch('enablePayInParts') && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input placeholder="Part Name" value={payInPartData.partName} onChange={(e) => setPayInPartData({...payInPartData, partName: e.target.value})} />
                                        <Input type="number" placeholder="Months" value={payInPartData.durationMonths} onChange={(e) => setPayInPartData({...payInPartData, durationMonths: e.target.value === '' ? '' : parseInt(e.target.value) || 0})} />
                                        <Input type="number" placeholder="Price" value={payInPartData.price} onChange={(e) => setPayInPartData({...payInPartData, price: e.target.value === '' ? '' : parseFloat(e.target.value) || 0})} />
                                    </div>
                                    <Button type="button" onClick={handleAddPayInPart} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Pay in Part</Button>
                                
                                {fields.length > 0 && (
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Months</TableHead><TableHead>Price</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell>{field.partName}</TableCell>
                                                    <TableCell>{field.durationMonths}</TableCell>
                                                    <TableCell>{formatCurrency(field.price)}</TableCell>
                                                    <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                </div>
                            )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Tour Information</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Tour Description</FormLabel><FormControl><Textarea placeholder="A detailed description of the tour package." {...field} rows={5} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="highlights" render={({ field }) => ( <FormItem><FormLabel>Highlights</FormLabel><FormControl><Textarea placeholder="e.g., Stunning mountain views, Sherpa culture, ..." {...field} /></FormControl><FormDescription>Enter highlights, separated by commas.</FormDescription><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="inclusions" render={({ field }) => ( <FormItem><FormLabel>Inclusions</FormLabel><FormControl><Textarea placeholder="e.g., Accommodation, Meals, Guide, ..." {...field} /></FormControl><FormDescription>Enter inclusions, separated by commas.</FormDescription><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="exclusions" render={({ field }) => ( <FormItem><FormLabel>Exclusions</FormLabel><FormControl><Textarea placeholder="e.g., International flights, Visa fees, ..." {...field} /></FormControl><FormDescription>Enter exclusions, separated by commas.</FormDescription><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="bookingPolicies" render={({ field }) => ( <FormItem><FormLabel>Booking Policies</FormLabel><FormControl><Textarea placeholder="Define the booking policies." {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="cancellationPolicies" render={({ field }) => ( <FormItem><FormLabel>Cancellation Policies</FormLabel><FormControl><Textarea placeholder="Define the cancellation policies." {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={form.control} name="termsAndConditions" render={({ field }) => ( <FormItem><FormLabel>Terms and Conditions</FormLabel><FormControl><Textarea placeholder="Define the terms and conditions." {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Featured Details</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="isFeatured" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Featured Package</FormLabel><FormDescription>Display this package prominently on the homepage.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                {form.watch('isFeatured') && (
                                    <FormItem>
                                        <FormLabel>Featured Image</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center justify-center w-full">
                                            <label htmlFor="featured-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload featured image</span></p>
                                                </div>
                                                <Input id="featured-image-upload" type="file" className="hidden" />
                                            </label>
                                            </div> 
                                        </FormControl>
                                    </FormItem>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Tour Gallery</CardTitle></CardHeader>
                            <CardContent>
                                <FormItem>
                                    <FormLabel>Upload Images</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center justify-center w-full">
                                        <label htmlFor="gallery-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG (Recommended 800x400px)</p>
                                            </div>
                                            <Input id="gallery-upload" type="file" className="hidden" multiple />
                                        </label>
                                        </div> 
                                    </FormControl>
                                </FormItem>
                            </CardContent>
                        </Card>
                    </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit">Create Package</Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>
  )
}

    