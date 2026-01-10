
"use client"

import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, differenceInDays } from 'date-fns';

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
    return { label: 'High', className: 'bg-red-500/80 text-white' };
  }
  return { label: 'Low', className: 'bg-yellow-500/80 text-white' };
};


export function ExpiringPackagesTable({ data }: { data: ExpiringPackage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Packages Nearing Expiry</CardTitle>
        <CardDescription>Tour packages that will be withdrawn within the next 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Package Name</TableHead>
              <TableHead className="text-right">Expiry Date</TableHead>
              <TableHead className="text-right">Urgency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? data.map((pkg) => {
              const expiryDate = new Date(pkg.withdrawalDate);
              const status = getExpiryStatus(expiryDate);
              return (
                <TableRow key={pkg.id}>
                    <TableCell>
                        <Image
                        src={pkg.featured_image_url || `https://picsum.photos/seed/${pkg.id}/64/64`}
                        alt={pkg.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover aspect-square"
                        />
                    </TableCell>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="text-right">{format(expiryDate, "PPP")}</TableCell>
                    <TableCell className="text-right">
                        <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                </TableRow>
              )
            }) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
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
