
"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, View, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TripDay } from "@/lib/types";
import { getStatusBadgeColor, cn } from "@/lib/utils";
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
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { getTripDays, deleteTripDay } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";

type TripDayWithPackageAndCount = TripDay & { 
  tour_package: { name: string } | null;
  activities_count: number;
};

export default function TripDaysPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [allTripDays, setAllTripDays] = React.useState<TripDayWithPackageAndCount[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTripDays = async () => {
      setLoading(true);
      const days = await getTripDays();
      console.log('Fetched Trip Days Data:', days); // Console log added here
      setAllTripDays(days as TripDayWithPackageAndCount[]);
      setLoading(false);
    };
    fetchTripDays();
  }, []);

  const handleDelete = async (dayId: string, dayName: string) => {
    try {
      await deleteTripDay(dayId);
      setAllTripDays(allTripDays.filter(d => d.id !== dayId));
      toast({
        title: "Success",
        description: `Trip day "${dayName}" has been deleted.`,
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete trip day.",
      });
    }
  };

  const filteredTripDays = allTripDays.filter((day) =>
    (day.day_name && day.day_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (day.tour_package?.name && day.tour_package.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalDays = allTripDays.length;
  const activeDays = allTripDays.filter(d => d.status === 'active').length;
  const inactiveDays = totalDays - activeDays;

  const stats = [
    { label: "Total Days", value: totalDays, icon: <CalendarDays className="h-4 w-4" /> },
    { label: "Active", value: activeDays, icon: <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> },
    { label: "Inactive", value: inactiveDays, icon: <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> },
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
                <CardTitle>Trip Days</CardTitle>
                <CardDescription>Manage your trip days from here.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Input
                placeholder="Search by day or package..."
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
                <TableHead>Day Name</TableHead>
                <TableHead className="hidden sm:table-cell">Day No.</TableHead>
                <TableHead className="hidden md:table-cell">Tour Package</TableHead>
                <TableHead className="hidden md:table-cell">Activities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredTripDays.length > 0 ? (
                filteredTripDays.map((day) => {
                    return (
                    <TableRow key={day.id}>
                        <TableCell className="font-medium">{day.day_name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{day.day_number}</TableCell>
                        <TableCell className="hidden md:table-cell">{day.tour_package?.name || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">{day.activities_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(day.status))}>{day.status}</Badge>
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
                                    This action cannot be undone. This will permanently delete the trip day "{day.day_name}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(day.id, day.day_name)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
