
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type PopularPackage = {
    name: string;
    quantity: number;
    price: number;
}

export function PopularPackagesTable({ data }: { data: PopularPackage[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Bookings Packages</CardTitle>
        <Button variant="link" asChild><Link href="#">See All</Link></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Sold Quantity</TableHead>
              <TableHead className="text-right">Price (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? data.slice(0, 3).map((pkg, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell className="text-right">{pkg.quantity}</TableCell>
                <TableCell className="text-right">{pkg.price.toLocaleString('en-IN')}</TableCell>
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

    