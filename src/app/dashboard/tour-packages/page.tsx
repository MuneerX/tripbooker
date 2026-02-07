
"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, Package, MoreHorizontal, FilePenLine, Trash2, View, CheckCircle, XCircle, ArrowUp, ArrowDown } from "lucide-react";
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

type SortableKeys = 'name' | 'days' | 'base_price' | 'created_at' | 'package_type' | 'category' | 'is_active';

export default function TourPackagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allPackages, setAllPackages] = React.useState<TourPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemToDelete, setItemToDelete] = React.useState<TourPackage | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>(null);

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

  const sortedPackages = React.useMemo(() => {
    let sortableItems = [...filteredPackages];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (sortConfig.key === 'created_at') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPackages, sortConfig]);

  const handleSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const renderSortArrow = (key: SortableKeys) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const totalPages = Math.ceil(sortedPackages.length / rowsPerPage);
  const paginatedPackages = sortedPackages.slice(
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
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {stats.map(stat => <StatCard key={stat.label} card={stat} />)}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Tour Packages</CardTitle>
              <CardDescription>Manage your tour packages from here.</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                placeholder="Search by tour name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
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
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading tour packages...</div>
            ) : paginatedPackages.length > 0 ? (
              paginatedPackages.map((pkg: TourPackage) => (
                <Card key={pkg.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/tour-packages/${pkg.id}`)}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm line-clamp-1">{pkg.name}</CardTitle>
                      <div onClick={(e) => e.stopPropagation()}>
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
                      </div>
                    </div>
                     <CardDescription className="text-xs capitalize">{pkg.package_type} &bull; {pkg.category}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm space-y-2">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span>{formatCurrency(pkg.base_price)}</span>
                     </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{pkg.days}D / {pkg.nights}N</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(pkg.is_active ? 'active' : 'inactive'))}>{pkg.is_active ? 'active' : 'inactive'}</Badge>
                      </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">No tour packages found.</div>
            )}
          </div>
          
          {/* Desktop view */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Tour Name {renderSortArrow('name')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('days')}>
                   <div className="flex items-center">Days {renderSortArrow('days')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('base_price')}>
                   <div className="flex items-center">Price {renderSortArrow('base_price')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('created_at')}>
                   <div className="flex items-center">Created Date {renderSortArrow('created_at')}</div>
                </TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('package_type')}>
                   <div className="flex items-center">Type {renderSortArrow('package_type')}</div>
                </TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('category')}>
                   <div className="flex items-center">Category {renderSortArrow('category')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('is_active')}>
                   <div className="flex items-center">Status {renderSortArrow('is_active')}</div>
                </TableHead>
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
                  <TableRow key={pkg.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/tour-packages/${pkg.id}`)}>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedPackages.length}</strong> of <strong>{sortedPackages.length}</strong> packages
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
