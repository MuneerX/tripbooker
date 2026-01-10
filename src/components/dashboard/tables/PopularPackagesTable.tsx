
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"

type PopularPackage = {
    name: string;
    quantity: number;
    price: number;
}

export function PopularPackagesTable({ data }: { data: PopularPackage[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Top Bookings Packages</CardTitle>
          <CardDescription>Your most frequently booked packages.</CardDescription>
        </div>
        <Button asChild size="sm">
            <Link href="/dashboard/tour-packages">See All <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
        </Button>
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
