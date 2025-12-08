

"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import type { PayInPart } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PayInPartsFormModal } from "./PayInPartsFormModal";


export function PayInPartsForm() {
  const { control } = useFormContext<{ pay_in_parts: PayInPart[] }>();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "pay_in_parts",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage payment installment plans for this package.</p>
        <PayInPartsFormModal onSave={(data) => append({ ...data, id: crypto.randomUUID() })}>
             <Button type="button" variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Plan
            </Button>
        </PayInPartsFormModal>
      </div>

       <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Months</TableHead>
              <TableHead>Monthly Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length > 0 ? fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>{field.plan_name}</TableCell>
                <TableCell>{field.months}</TableCell>
                <TableCell>{formatCurrency(field.monthly_payment)}</TableCell>
                <TableCell>{formatCurrency(field.total_amount)}</TableCell>
                <TableCell className="flex gap-2">
                    <PayInPartsFormModal 
                        plan={field} 
                        onSave={(data) => update(index, data)}
                    >
                        <Button type="button" variant="outline" size="sm">Edit</Button>
                    </PayInPartsFormModal>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No payment plans added.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
