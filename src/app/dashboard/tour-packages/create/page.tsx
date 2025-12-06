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
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const tourPackageSchema = z.object({
  tourName: z.string().min(1, "Tour name is required"),
  tourType: z.enum(["domestic", "international"]),
  category: z.enum(["adventure", "leisure", "pilgrimage", "cultural", "wildlife"]),
  basePrice: z.coerce.number().min(0, "Price must be a positive number"),
  days: z.coerce.number().int().min(1, "Must be at least 1 day"),
  nights: z.coerce.number().int().min(0, "Nights cannot be negative"),
  introductionDate: z.date(),
  description: z.string().min(1, "Description is required"),
  isFeatured: z.boolean().default(false),
  status: z.enum(["active", "inactive"]),
});

type TourPackageFormValues = z.infer<typeof tourPackageSchema>;

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
      description: "",
      isFeatured: false,
      status: "active",
    },
  });

  const onSubmit = (data: TourPackageFormValues) => {
    console.log(data);
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
        <CardDescription>Fill out the details for the new tour package.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="tourName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tour Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Himalayan Adventure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description of the tour." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tourType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tour Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="domestic">Domestic</SelectItem>
                          <SelectItem value="international">International</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="leisure">Leisure</SelectItem>
                          <SelectItem value="pilgrimage">Pilgrimage</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="wildlife">Wildlife</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="introductionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Introduction Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 7" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nights</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 6" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center space-x-4 pt-4">
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Featured Package
                        </FormLabel>
                        <FormDescription>
                          Display this package prominently on the homepage.
                        </FormDescription>
                      </div>
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
                          <SelectTrigger>
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
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Create Package</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
