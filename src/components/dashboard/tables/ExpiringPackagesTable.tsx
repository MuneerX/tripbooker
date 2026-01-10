
"use client"

import Image from "next/image"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from 'date-fns';
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ExpiringPackage = {
    id: string;
    name: string;
    withdrawalDate: string;
    featured_image_url: string | null;
}

const getExpiryStatus = (expiryDate: Date): { label: 'Low' | 'High'; className: string } => {
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expiryDate, today);

  if (daysUntilExpiry <= 10) {
    return { label: 'High', className: 'bg-red-100 text-red-600 border-red-200' };
  }
  return { label: 'Low', className: 'bg-orange-100 text-orange-600 border-orange-200' };
};


export function ExpiringPackagesTable({ data }: { data: ExpiringPackage[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Package Going Expiry</CardTitle>
          <CardDescription>Packages nearing their withdrawal date.</CardDescription>
        </div>
        <Button variant="link" asChild><Link href="#">See All</Link></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {data.length > 0 ? data.map((pkg) => {
              const expiryDate = new Date(pkg.withdrawalDate);
              const status = getExpiryStatus(expiryDate);
              return (
                <TableRow key={pkg.id}>
                    <TableCell className="p-2">
                        <Image
                        src={pkg.featured_image_url || `https://picsum.photos/seed/${pkg.id}/64/64`}
                        alt={pkg.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover aspect-square"
                        />
                    </TableCell>
                    <TableCell className="font-medium p-2">
                        <p className="font-semibold">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">Effective To: {format(expiryDate, "dd/MM/yyyy")}</p>
                    </TableCell>
                    <TableCell className="text-right p-2">
                        <Badge variant="outline" className={status.className}>{status.label}</Badge>
                    </TableCell>
                </TableRow>
              )
            }) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  No packages are expiring soon.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
