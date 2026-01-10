
"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Package, MoreHorizontal, FilePenLine, Trash2, View, CheckCircle, XCircle } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { getTourPackages, deleteTourPackage } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";

export default function TourPackagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allPackages, setAllPackages] = React.useState<TourPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemToDelete, setItemToDelete] = React.useState<TourPackage | null>(null);

  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const packages = await getTourPackages();
      setAllPackages(packages);
      setLoading(false);
    };
    fetchPackages();
  }, []);

  React.useEffect(() => {
    if (itemToDelete) {
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.pointerEvents = '';
    }
    // Cleanup function to ensure pointer-events are re-enabled when component unmounts
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, [itemToDelete]);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteTourPackage(itemToDelete);
      toast({
        title: "Success",
        description: `Tour package "${itemToDelete.name}" has been deleted.`,
      });
      setAllPackages(prev => prev.filter(p => p.id !== itemToDelete.id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting package",
        description: error.message,
      });
    } finally {
      setItemToDelete(null);
    }
  };


  const filteredPackages = allPackages.filter((pkg) =>
    pkg.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPackages.length / rowsPerPage);
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalPackages = allPackages.length;
  const activePackages = allPackages.filter(p => p.is_active).length;
  const inactivePackages = totalPackages - activePackages;

  const stats = [
    { label: "Total Packages", value: totalPackages, icon: <Package className="h-4 w-4" /> },
    { label: "Active", value: activePackages, icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { label: "Inactive", value: inactivePackages, icon: <XCircle className="h-4 w-4 text-red-500" /> },
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
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{pkg.days}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCurrency(pkg.base_price)}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(pkg.created_at), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="capitalize">{pkg.package_type}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="capitalize">{pkg.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(pkg.is_active ? 'active' : 'inactive'))}>{pkg.is_active ? 'active' : 'inactive'}</Badge>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onSelect={() => setItemToDelete(pkg)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the tour package "{itemToDelete.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
