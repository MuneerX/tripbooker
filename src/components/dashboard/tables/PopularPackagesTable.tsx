
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type PopularPackage = {
    name: string;
    quantity: number;
    price: number;
}

export function PopularPackagesTable({ data }: { data: PopularPackage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Booking Packages</CardTitle>
        <CardDescription>Top-selling tour packages based on booking quantity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package Name</TableHead>
              <TableHead className="text-right">Sold Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? data.map((pkg, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell className="text-right">{pkg.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(pkg.price)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  No booking data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
