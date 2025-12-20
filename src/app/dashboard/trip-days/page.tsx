
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, View } from "lucide-react";
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
};

export default function TripDaysPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [allTripDays, setAllTripDays] = React.useState<TripDayWithPackageAndActivities[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [itemToDelete, setItemToDelete] = React.useState<TripDayWithPackageAndActivities | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;

  React.useEffect(() => {
    async function fetchTripDays() {
      setLoading(true);
      const days = await getTripDays();
      setAllTripDays(days as TripDayWithPackageAndActivities[]);
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
  
  const totalPages = Math.ceil(filteredTripDays.length / rowsPerPage);
  const paginatedTripDays = filteredTripDays.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="flex flex-col gap-6">
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <div>
                <CardTitle>Trip Days</CardTitle>
                <CardDescription>Manage your trip days from here.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search by title or package..."
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64"
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
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Package Name</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="hidden sm:table-cell w-[100px] text-center">Day</TableHead>
                <TableHead className="hidden md:table-cell text-center">Activities</TableHead>
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
                    const activityCount = day.activities?.length || 0;
                    const totalCost = day.activities?.reduce((sum, act) => sum + (Number(act.additional_cost) || 0), 0) || 0;
                    return (
                    <TableRow key={day.id}>
                        <TableCell className="font-medium">{day.title || day.day_name}</TableCell>
                        <TableCell className="hidden md:table-cell">{day.tour_package?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatCurrency(totalCost)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">{day.day_number}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">{activityCount}</TableCell>
                        <TableCell className="text-right">
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
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedTripDays.length}</strong> of <strong>{filteredTripDays.length}</strong> days
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
