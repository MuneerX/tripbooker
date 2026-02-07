
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, View, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TripDay } from "@/lib/types";
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
import { getTripDays, deleteTripDay } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

type TripDayWithPackageAndActivities = TripDay & { 
  tour_package: { name: string } | null;
  activities: { additional_cost: number | null }[];
  activityCount: number;
  totalCost: number;
};

type SortableKeys = 'title' | 'tour_package.name' | 'totalCost' | 'day_number' | 'activityCount';

export default function TripDaysPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [allTripDays, setAllTripDays] = React.useState<TripDayWithPackageAndActivities[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [itemToDelete, setItemToDelete] = React.useState<TripDayWithPackageAndActivities | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>(null);

  const rowsPerPage = 10;

  React.useEffect(() => {
    async function fetchTripDays() {
      setLoading(true);
      const days = await getTripDays();
      const processedDays = days.map(day => ({
        ...day,
        activityCount: day.activities?.length || 0,
        totalCost: day.activities?.reduce((sum, act) => sum + (Number(act.additional_cost) || 0), 0) || 0
      })) as TripDayWithPackageAndActivities[];
      setAllTripDays(processedDays);
      setLoading(false);
    }
    fetchTripDays();
  }, []);

  React.useEffect(() => {
    if (itemToDelete) {
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, [itemToDelete]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTripDay(itemToDelete.id);
      setAllTripDays(prevDays => prevDays.filter(day => day.id !== itemToDelete.id));
      toast({
        title: "Success",
        description: `Trip day "${itemToDelete.title || itemToDelete.day_name}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting trip day",
        description: error.message,
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredTripDays = allTripDays.filter((day) =>
    (day.title && day.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (day.tour_package?.name && day.tour_package.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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

  const sortedTripDays = React.useMemo(() => {
    let sortableItems = [...filteredTripDays];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);
        
        let aValue = getNestedValue(a, sortConfig.key);
        let bValue = getNestedValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredTripDays, sortConfig]);

  const totalPages = Math.ceil(sortedTripDays.length / rowsPerPage);
  const paginatedTripDays = sortedTripDays.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex flex-col gap-6">
        <Card>
        <CardHeader>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Trip Days</CardTitle>
                <CardDescription>Manage your trip days from here.</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input
                    placeholder="Search by title or package..."
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                />
                <Button asChild>
                <Link href="/dashboard/trip-days/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Trip Day
                </Link>
                </Button>
            </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('title')}>
                    <div className="flex items-center">Title {renderSortArrow('title')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('tour_package.name')}>
                    <div className="flex items-center">Package Name {renderSortArrow('tour_package.name')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('totalCost')}>
                    <div className="flex items-center">Price {renderSortArrow('totalCost')}</div>
                </TableHead>
                <TableHead className="hidden sm:table-cell w-[100px] text-center cursor-pointer hover:bg-muted" onClick={() => handleSort('day_number')}>
                    <div className="flex items-center justify-center">Day {renderSortArrow('day_number')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell text-center cursor-pointer hover:bg-muted" onClick={() => handleSort('activityCount')}>
                    <div className="flex items-center justify-center">Activities {renderSortArrow('activityCount')}</div>
                </TableHead>
                <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paginatedTripDays.length > 0 ? (
                paginatedTripDays.map((day) => {
                    return (
                    <TableRow key={day.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/trip-days/${day.id}`)}>
                        <TableCell className="font-medium">{day.title || day.day_name}</TableCell>
                        <TableCell className="hidden md:table-cell">{day.tour_package?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatCurrency(day.totalCost)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">{day.day_number}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">{day.activityCount}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => router.push(`/dashboard/trip-days/${day.id}`)}>
                                  <View className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => router.push(`/dashboard/trip-days/edit/${day.id}`)}>
                                  <FilePenLine className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onSelect={() => setItemToDelete(day)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    );
                })
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    No results found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedTripDays.length}</strong> of <strong>{sortedTripDays.length}</strong> days
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
                  This action cannot be undone. This will permanently delete the trip day "{itemToDelete.title || itemToDelete.day_name}".
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
