
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getProfileById, updateProfile } from "@/lib/supabase/queries";
import { format } from "date-fns";
import { useBreadcrumb } from "../../../layout";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  whatsapp_number: z.string().min(1, "WhatsApp number is required"),
  dob: z.date({ invalid_type_error: "Invalid date" }).optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  pincode: z.string().min(1, "Pincode is required"),
  is_kv_customer: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();
  const [loading, setLoading] = React.useState(true);
  
  const [day, setDay] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [year, setYear] = React.useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {},
  });

  React.useEffect(() => {
    if (id) {
      const fetchProfile = async () => {
        setLoading(true);
        const profileData = await getProfileById(id);
        if (profileData) {
          const dob = profileData.dob ? new Date(profileData.dob) : null;
          form.reset({
            ...profileData,
            dob: dob,
          });
          if (dob) {
            setDay(String(dob.getDate()).padStart(2, '0'));
            setMonth(String(dob.getMonth() + 1).padStart(2, '0'));
            setYear(String(dob.getFullYear()));
          }
          setBreadcrumbName(`Edit: ${profileData.full_name}`);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Customer not found.",
          });
          router.push("/dashboard/customers");
        }
        setLoading(false);
      };
      fetchProfile();
    }
     return () => setBreadcrumbName('');
  }, [id, router, toast, form, setBreadcrumbName]);

  React.useEffect(() => {
      try {
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (day.length === 2 && month.length === 2 && year.length === 4 && 
            !isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum)) {
            const date = new Date(yearNum, monthNum - 1, dayNum);
            // Check if the constructed date is valid and matches the input
            if (date.getFullYear() === yearNum && date.getMonth() === monthNum - 1 && date.getDate() === dayNum) {
                form.setValue('dob', date, { shouldValidate: true });
            } else {
                 form.setError('dob', { type: 'manual', message: 'Invalid date. Please check the day, month, and year.' });
            }
        } else if (!day && !month && !year) {
           form.setValue('dob', null, { shouldValidate: true });
           form.clearErrors('dob');
        } else {
            // Clear if incomplete to avoid submitting partial/stale date
            form.setValue('dob', undefined, { shouldValidate: true });
        }
      } catch (e) {
          form.setError('dob', { type: 'manual', message: 'Invalid date format.' });
      }
  }, [day, month, year, form]);


  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile(id, {
        ...data,
        dob: data.dob ? format(data.dob, "yyyy-MM-dd") : null,
      });
      toast({
        title: "Success!",
        description: "Customer profile has been updated.",
      });
      router.push("/dashboard/customers");
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not update the profile.",
      });
    }
  };
  
  if (loading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-7" />
                <Skeleton className="h-6 w-48" />
                <div className="ml-auto flex items-center gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const originalProfileName = form.getValues('full_name');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="flex-1 text-xl font-semibold">
            Edit Customer: {originalProfileName}
          </h1>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Update the details for this customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="full_name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="phone_number" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="whatsapp_number" render={({ field }) => ( <FormItem><FormLabel>WhatsApp Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              
               <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <div className="flex items-center gap-2">
                      <Input 
                          placeholder="DD" 
                          maxLength={2} 
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          className="text-center"
                      />
                      <Input 
                          placeholder="MM" 
                          maxLength={2} 
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                           className="text-center"
                      />
                      <Input 
                          placeholder="YYYY" 
                          maxLength={4} 
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                           className="text-center"
                      />
                  </div>
                  <FormField control={form.control} name="dob" render={() => ( <FormMessage /> )}/>
              </FormItem>

              <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel>District</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="pincode" render={({ field }) => ( <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="is_kv_customer" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-6">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Customer</FormLabel>
                    <FormDescription>
                      Inactive (blocked) customers cannot log in or make new bookings.
                    </FormDescription>
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
      </form>
    </Form>
  );
}

    