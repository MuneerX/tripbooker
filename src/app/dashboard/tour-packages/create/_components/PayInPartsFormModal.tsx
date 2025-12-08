

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PayInPart } from "@/lib/types";

const payInPartSchema = z.object({
  id: z.string().optional(),
  plan_name: z.string().min(1, "Plan name is required"),
  months: z.coerce.number().int().min(0, "Months must be a positive number"),
  monthly_payment: z.coerce.number().min(0, "Monthly payment must be a positive number"),
  total_amount: z.coerce.number().min(0, "Total amount must be a positive number"),
  processing_fee: z.coerce.number().min(0).default(0),
});

type PayInPartFormValues = z.infer<typeof payInPartSchema>;

type PayInPartsFormModalProps = {
  children: React.ReactNode;
  plan?: Partial<PayInPart>;
  onSave: (data: PayInPart) => void;
};

const defaultPlanValues: Partial<PayInPartFormValues> = {
  plan_name: "",
  months: 0,
  monthly_payment: 0,
  total_amount: 0,
  processing_fee: 0,
};

export function PayInPartsFormModal({ children, plan, onSave }: PayInPartsFormModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const form = useForm<PayInPartFormValues>({
    resolver: zodResolver(payInPartSchema),
    defaultValues: plan || defaultPlanValues,
  });
  
  React.useEffect(() => {
    if (isOpen) {
        form.reset(plan ? { ...plan } : defaultPlanValues);
    }
  }, [isOpen, plan, form]);


  const handleSave = (data: PayInPartFormValues) => {
    onSave(data as PayInPart);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{plan?.id ? "Edit" : "Add"} Payment Plan</DialogTitle>
                    <DialogDescription>
                        Fill in the details for this installment plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <FormField
                        control={form.control}
                        name="plan_name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Deposit" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="months"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Months</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 3" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="monthly_payment"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Monthly Payment</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 500" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                     <FormField
                        control={form.control}
                        name="total_amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Total Amount</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 1500" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={form.handleSubmit(handleSave)}>Save Plan</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
