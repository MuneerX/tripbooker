
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
} from "@/components/ui/dialog";

export const activitySchema = z.object({
    id: z.string().uuid().optional().or(z.literal('')),
    trip_day_id: z.string().uuid().optional().or(z.literal('')),
    title: z.string().min(1, "Activity title is required"),
    activity_type: z.enum(["trekking", "sightseeing", "meal", "transport", "accommodation", "adventure", "shopping", "leisure", "food", "explore", "stay"]),
    activity_time: z.string().regex(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, "Invalid time format. Use HH:mm:ss").optional().nullable(),
    duration_minutes: z.coerce.number().int().min(0, "Duration must be a positive number").optional().nullable(),
    travel_duration_minutes: z.coerce.number().int().min(0, "Travel duration must be a positive number").optional().nullable(),
    description: z.string().optional().nullable(),
    additional_cost: z.coerce.number().min(0).default(0).optional().nullable(),
    cost_included: z.boolean().default(true).optional().nullable(),
    booking_required: z.boolean().default(false).optional().nullable(),
    special_instructions: z.string().optional().nullable(),
    place_id: z.string().uuid().optional().nullable(),
});


export type ActivityFormValues = z.infer<typeof activitySchema>;

type ActivityFormModalProps = {
    children: React.ReactNode;
    activity?: ActivityFormValues;
    onSave: (data: ActivityFormValues) => void;
}

const defaultActivityValues: Partial<ActivityFormValues> = {
  title: "",
  activity_type: "explore",
  activity_time: "09:00:00",
  duration_minutes: 60,
  travel_duration_minutes: 0,
  description: "",
  additional_cost: 0,
  cost_included: true,
  booking_required: false,
  special_instructions: "",
  place_id: undefined,
};

export function ActivityFormModal({ children, activity, onSave }: ActivityFormModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const activityForm = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema),
        defaultValues: activity || defaultActivityValues,
    });

    React.useEffect(() => {
        if (isOpen) {
            activityForm.reset(activity ? {
              ...activity,
              activity_time: activity.activity_time || "00:00:00",
            } : defaultActivityValues);
        }
    }, [isOpen, activity, activityForm]);

    const handleSave = (data: ActivityFormValues) => {
        console.log('Saving activity data:', data);
        onSave(data);
        setIsOpen(false);
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                 <Form {...activityForm}>
                    <form onSubmit={activityForm.handleSubmit(handleSave)} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>{activity ? 'Edit' : 'Add'} Activity</DialogTitle>
                            <DialogDescription>Fill in the details for the activity.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <FormField control={activityForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Activity Title</FormLabel><FormControl><Input placeholder="e.g., Sunset Cruise" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={activityForm.control} name="activity_type" render={({ field }) => ( <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>
                                  <SelectItem value="food">Food</SelectItem>
                                  <SelectItem value="explore">Explore</SelectItem>
                                  <SelectItem value="stay">Stay</SelectItem>
                                  <SelectItem value="trekking">Trekking</SelectItem>
                                  <SelectItem value="sightseeing">Sightseeing</SelectItem>
                                  <SelectItem value="meal">Meal</SelectItem>
                                  <SelectItem value="transport">Transport</SelectItem>
                                  <SelectItem value="accommodation">Accommodation</SelectItem>
                                  <SelectItem value="adventure">Adventure</SelectItem>
                                  <SelectItem value="shopping">Shopping</SelectItem>
                                  <SelectItem value="leisure">Leisure</SelectItem>
                                  </SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField control={activityForm.control} name="activity_time" render={({ field }) => ( <FormItem><FormLabel>Time (HH:mm:ss)</FormLabel><FormControl><Input placeholder="e.g., 17:30:00" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                             <div className="grid md:grid-cols-2 gap-4">
                                <FormField control={activityForm.control} name="duration_minutes" render={({ field }) => ( <FormItem><FormLabel>Activity Duration (minutes)</FormLabel><FormControl><Input type="number" placeholder="e.g., 120" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="travel_duration_minutes" render={({ field }) => ( <FormItem><FormLabel>Travel Duration (minutes)</FormLabel><FormControl><Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                            <FormField control={activityForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the activity" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={activityForm.control} name="special_instructions" render={({ field }) => ( <FormItem><FormLabel>Special Instructions</FormLabel><FormControl><Textarea placeholder="e.g., Bring sunscreen" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />

                             <div className="grid md:grid-cols-3 gap-4 items-center">
                                <FormField control={activityForm.control} name="additional_cost" render={({ field }) => ( <FormItem><FormLabel>Additional Cost (USD)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={activityForm.control} name="cost_included" render={({ field }) => (<FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Cost Included</FormLabel></FormItem>)} />
                                <FormField control={activityForm.control} name="booking_required" render={({ field }) => (<FormItem className="flex items-center gap-2 pt-8"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Booking Required</FormLabel></FormItem>)} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Activity</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
