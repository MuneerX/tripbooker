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
import mockData from "@/lib/data";
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

export default function TripDaysPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredTripDays = mockData.tripDays.filter((day) =>
    day.dayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trip Days</CardTitle>
            <CardDescription>Manage your trip days from here.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by day name..."
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
              <TableHead>Day Number</TableHead>
              <TableHead className="hidden md:table-cell">Tour Package</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTripDays.length > 0 ? (
              filteredTripDays.map((day: TripDay) => {
                const tourPackage = mockData.tourPackages.find(p => p.id === day.tourPackageId);
                return (
                  <TableRow key={day.id}>
                    <TableCell className="font-medium">{day.dayName}</TableCell>
                    <TableCell>{day.dayNumber}</TableCell>
                    <TableCell className="hidden md:table-cell">{tourPackage?.tourName || 'N/A'}</TableCell>
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
                                This action cannot be undone. This will permanently delete the trip day "{day.dayName}".
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
                );
            })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
