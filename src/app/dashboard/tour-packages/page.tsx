
"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Package, MoreHorizontal, FilePenLine, Trash2, View } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TourPackage } from "@/lib/types";
import { formatCurrency, getStatusBadgeColor, cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getTourPackages } from "@/lib/supabase/queries";

export default function TourPackagesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allPackages, setAllPackages] = React.useState<TourPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const packages = await getTourPackages();
      console.log('Fetched Packages:', packages);
      setAllPackages(packages);
      setLoading(false);
    };
    fetchPackages();
  }, []);

  const filteredPackages = allPackages.filter((pkg) =>
    pkg.tourName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPackages.length / rowsPerPage);
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalPackages = allPackages.length;
  const activePackages = allPackages.filter(p => p.status === 'active').length;
  const inactivePackages = totalPackages - activePackages;

  const stats = [
    { label: "Total Packages", value: totalPackages, icon: <Package className="h-4 w-4" /> },
    { label: "Active", value: activePackages, icon: <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> },
    { label: "Inactive", value: inactivePackages, icon: <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(stat => <StatCard key={stat.label} card={stat} />)}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tour Packages</CardTitle>
              <CardDescription>Manage your tour packages from here.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by tour name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
              />
              <Button asChild>
                <Link href="/dashboard/tour-packages/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Package
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour Name</TableHead>
                <TableHead className="hidden md:table-cell">Days</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Start Date</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading tour packages...
                  </TableCell>
                </TableRow>
              ) : paginatedPackages.length > 0 ? (
                paginatedPackages.map((pkg: TourPackage) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.tourName}</TableCell>
                    <TableCell className="hidden md:table-cell">{pkg.days}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCurrency(pkg.basePrice)}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(pkg.introductionDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="capitalize">{pkg.tourType}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="capitalize">{pkg.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(pkg.status))}>{pkg.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => router.push(`/dashboard/tour-packages/${pkg.id}`)}>
                                <View className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => router.push(`/dashboard/tour-packages/edit/${pkg.id}`)}>
                                <FilePenLine className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the tour package "{pkg.tourName}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedPackages.length}</strong> of <strong>{filteredPackages.length}</strong> packages
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
