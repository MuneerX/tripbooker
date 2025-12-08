
"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import type { TourPackage } from "@/lib/types";

export function PayInPartsForm() {
  const { control } = useFormContext<TourPackage>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pay_in_parts",
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={field.id} className="bg-muted/50">
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4 relative">
             <FormField
              control={control}
              name={`pay_in_parts.${index}.plan_name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Deposit" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name={`pay_in_parts.${index}.months`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Months</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 3" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`pay_in_parts.${index}.monthly_payment`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Payment</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name={`pay_in_parts.${index}.total_amount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 1500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove Part</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ plan_name: '', months: 0, monthly_payment: 0, total_amount: 0, processing_fee: 0, is_active: true })}
      >
        Add Payment Part
      </Button>
    </div>
  );
}
