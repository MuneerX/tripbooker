
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

export const activitySchema = z.object({
    id: z.string().optional(), // For Supabase ID
    name: z.string().min(1, "Activity name is required"),
    type: z.enum(["trekking", "sightseeing", "meal", "transport", "accommodation", "adventure", "shopping", "leisure"]),
    time: z.string().regex(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, "Invalid time format (e.g., 09:00 AM)"),
    duration: z.string().min(1, "Duration is required"),
    location: z.string().min(1, "Location is required"),
    price: z.coerce.number().min(0).default(0),
    price_included: z.boolean().default(true),
    booking_required: z.boolean().default(false),
    description: z.string().min(1, "Description is required"),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;

type ActivityFormModalProps = {
    children: React.ReactNode;
    activity?: ActivityFormValues & {id?: string};
    onSave: (data: ActivityFormValues) => void;
}

const defaultActivityValues: ActivityFormValues = {
  name: "",
  type: "sightseeing",
  time: "",
  duration: "",
  location: "",
  price: 0,
  price_included: true,
  booking_required: false,
  description: "",
};

export function ActivityFormModal({ children, activity, onSave }: ActivityFormModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const activityForm = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema),
        defaultValues: activity || defaultActivityValues
    });

    React.useEffect(() => {
        if (isOpen) {
            activityForm.reset(activity || defaultActivityValues);
        }
    }, [isOpen, activity, activityForm]);

    const handleSave = (data: ActivityFormValues) => {
        onSave(data);
        setIsOpen(false);
    }

    const onFormSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      activityForm.handleSubmit(handleSave)();
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                 <Form {...activityForm}>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle>{activity ? 'Edit' : 'Add'} Activity</DialogTitle>
                            <DialogDescription>Fill in the details for the activity.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={activityForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Activity Name</FormLabel><FormControl><Input placeholder="e.g., Sunset Cruise" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>
                                  <SelectItem value="trekking">Trekking</SelectItem>
                                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                                  <SelectItem value="meal">Meal</SelectItem>
                                  <SelectItem value="transport">Transport</SelectItem>
                                  <SelectItem value="accommodation">Accommodation</SelectItem>
                                  <SelectItem value="adventure">Adventure</SelectItem>
                                  <SelectItem value="shopping">Shopping</SelectItem>
                                  <SelectItem value="leisure">Leisure</SelectItem>
                                  </SelectContent></Select><FormMessage /></FormItem> )} />
                            </div>
                             <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={activityForm.control} name="time" render={({ field }) => ( <FormItem><FormLabel>Time</FormLabel><FormControl><Input placeholder="e.g., 05:00 PM" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="duration" render={({ field }) => ( <FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="e.g., 2 hours" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={activityForm.control} name="location" render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Name of the place" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={activityForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the activity" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <div className="grid md:grid-cols-3 gap-4 items-center">
                                <FormField control={activityForm.control} name="price" render={({ field }) => ( <FormItem><FormLabel>Price (USD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="price_included" render={({ field }) => (<FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Price Included</FormLabel></FormItem>)} />
                                <FormField control={activityForm.control} name="booking_required" render={({ field }) => (<FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Booking Required</FormLabel></FormItem>)} />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="button" onClick={onFormSubmit}>Save Activity</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

    