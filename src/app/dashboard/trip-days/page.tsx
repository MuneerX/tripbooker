
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, View, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TripDay, Activity } from "@/lib/types";
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
import { StatCard } from "@/components/dashboard/StatCard";
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
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchTripDays() {
      setLoading(true);
      const days = await getTripDays();
      setAllTripDays(days as TripDayWithPackageAndActivities[]);
      setLoading(false);
    }
    fetchTripDays();
  }, []);

  const handleDelete = async (dayId: string, dayName: string) => {
    setDeletingId(dayId);
    try {
      await deleteTripDay(dayId);
      setAllTripDays(prevDays => prevDays.filter(day => day.id !== dayId));
      toast({
        title: "Success",
        description: `Trip day "${dayName}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting trip day",
        description: error.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTripDays = allTripDays.filter((day) =>
    (day.title && day.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (day.tour_package?.name && day.tour_package.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalDays = allTripDays.length;

  const stats = [
    { label: "Total Days", value: totalDays, icon: <CalendarDays className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
            <StatCard card={stats[0]} />
        </div>
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
                <TableHead className="hidden sm:table-cell w-[80px]">Day</TableHead>
                <TableHead className="hidden md:table-cell text-center">No. of Activities</TableHead>
                <TableHead>
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
                ) : filteredTripDays.length > 0 ? (
                filteredTripDays.map((day) => {
                    const activityCount = day.activities?.length || 0;
                    const totalCost = day.activities?.reduce((sum, act) => sum + (Number(act.additional_cost) || 0), 0) || 0;
                    return (
                    <TableRow key={day.id}>
                        <TableCell className="font-medium">{day.title || day.day_name}</TableCell>
                        <TableCell className="hidden md:table-cell">{day.tour_package?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatCurrency(totalCost)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{day.day_number}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">{activityCount}</TableCell>
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
                                <DropdownMenuItem onSelect={() => router.push(`/dashboard/trip-days/${day.id}`)}>
                                    <View className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => router.push(`/dashboard/trip-days/edit/${day.id}`)}>
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
                                    This action cannot be undone. This will permanently delete the trip day "{day.title || day.day_name}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(day.id, day.title || day.day_name || '')} className="bg-destructive hover:bg-destructive/90">
                                  {deletingId === day.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
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
        </Card>
    </div>
  );
}
