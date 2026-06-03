"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Upload, File as FileIcon, X, ArrowLeft, RefreshCw } from "lucide-react"
import { createOperator } from "@/lib/supabase/queries"

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const operatorSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  contact_person: z.string().optional(),
  address: z.string().optional(),
  referral_code: z.string().optional(),
  description: z.string().optional(),
  is_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  logo_file: z.any()
    .optional()
    .refine((files) => !files || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (files) => !files || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type OperatorFormValues = z.infer<typeof operatorSchema>;

export default function CreateOperatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const form = useForm<OperatorFormValues>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      contact_person: "",
      address: "",
      referral_code: "",
      description: "",
      is_verified: false,
      is_active: true,
    },
  });

  const logoFile = form.watch("logo_file");
  const operatorName = form.watch("name");

  const generateReferralCode = () => {
    if (!operatorName) {
        toast({
            variant: "destructive",
            title: "Agent Name Required",
            description: "Please enter an agent name to generate a referral code.",
        });
        return;
    }
    const namePrefix = operatorName.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `${namePrefix}-${randomSuffix}`;
    form.setValue("referral_code", newCode);
  };

  const onSubmit = async (data: OperatorFormValues) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'logo_file') {
        formData.append(key, String(value));
      }
    });

    if (data.logo_file && data.logo_file.length > 0) {
      formData.append('logo_file', data.logo_file[0]);
    }

    try {
      await createOperator(formData);
      toast({
        title: "Success!",
        description: "New agent has been created.",
      });
      router.push('/dashboard/operators');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "Could not create the agent.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center gap-4">
                <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 text-xl font-semibold">Create New Agent</h1>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creating..." : "Create Agent"}
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Agent Details</CardTitle>
                            <CardDescription>Fill in the main details of the agent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Agent Name <span className="text-destructive">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Happy Trails Inc." {...field} />
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
                                    <Textarea placeholder="A brief description of the agent." {...field} />
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
                                    <Textarea placeholder="Agent's full address" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                             <FormField
                                control={form.control}
                                name="logo_file"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Agent Logo</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-4">
                                            <label htmlFor="logo-file" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer shadow-sm">
                                                Choose File
                                            </label>
                                            <Input 
                                                id="logo-file"
                                                type="file" 
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => field.onChange(e.target.files)}
                                            />
                                            {logoFile && logoFile.length > 0 ? (
                                                <div className="flex items-center justify-between p-2 bg-muted rounded-md flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium truncate max-w-xs">{logoFile[0].name}</span>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => form.setValue("logo_file", null, { shouldValidate: true })}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : <span className="text-sm text-muted-foreground">No file selected.</span>}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name="is_verified"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <FormLabel>Verified</FormLabel>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="is_active"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <FormLabel>Active</FormLabel>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                               control={form.control}
                               name="contact_person"
                               render={({ field }) => (
                                 <FormItem>
                                   <FormLabel>Contact Person</FormLabel>
                                   <FormControl>
                                     <Input placeholder="John Doe" {...field} />
                                   </FormControl>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="contact@happytrails.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+91 12345 67890" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Code</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name="referral_code"
                              render={({ field }) => ( 
                                <FormItem>
                                    <FormLabel>Referral Code</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                          <Input placeholder="e.g., HTI-REF" {...field} />
                                        </FormControl>
                                        <Button type="button" variant="outline" onClick={generateReferralCode} className="whitespace-nowrap">
                                            <RefreshCw className="mr-2 h-4 w-4"/> Generate Code
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem> 
                            )} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
      </Form>
    </div>
  )
}
