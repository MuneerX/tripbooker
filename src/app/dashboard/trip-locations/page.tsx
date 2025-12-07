
"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, View, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TripLocation } from "@/lib/types";
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
import Image from "next/image";
import { StatCard } from "@/components/dashboard/StatCard";
import { getTripLocations, deleteTripLocation } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";

export default function TripLocationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [allLocations, setAllLocations] = React.useState<TripLocation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchLocations() {
      setLoading(true);
      const locations = await getTripLocations();
      setAllLocations(locations);
      setLoading(false);
    }
    fetchLocations();
  }, []);

  const handleDelete = async (locationId: string, locationName: string) => {
    setDeletingId(locationId);
    try {
      await deleteTripLocation(locationId);
      setAllLocations(prev => prev.filter(loc => loc.id !== locationId));
      toast({
        title: "Success",
        description: `Location "${locationName}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting location",
        description: error.message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredLocations = allLocations.filter((location) =>
    location.name && location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalLocations = allLocations.length;
  const activeLocations = allLocations.filter(l => l.is_active).length;
  const inactiveLocations = totalLocations - activeLocations;

  const stats = [
    { label: "Total Locations", value: totalLocations, icon: <MapPin className="h-4 w-4" /> },
    { label: "Active", value: activeLocations, icon: <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> },
    { label: "Inactive", value: inactiveLocations, icon: <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> },
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
                <CardTitle>Trip Locations</CardTitle>
                <CardDescription>Manage your trip locations from here.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Input
                placeholder="Search by location name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64"
                />
                <Button asChild>
                <Link href="/dashboard/trip-locations/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Location
                </Link>
                </Button>
            </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Location Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">City</TableHead>
                <TableHead className="hidden md:table-cell">State</TableHead>
                <TableHead className="hidden md:table-cell">District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell>
                    </TableRow>
                ) : filteredLocations.length > 0 ? (
                filteredLocations.map((location: TripLocation) => (
                    <TableRow key={location.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Image
                        alt={location.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={location.image_urls?.[0] || "https://picsum.photos/seed/placeholder/64/64"}
                        width="64"
                        />
                    </TableCell>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="capitalize">{location.place_type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{location.city}</TableCell>
                    <TableCell className="hidden md:table-cell">{location.state}</TableCell>
                    <TableCell className="hidden md:table-cell">{location.district}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(location.is_active ? 'active' : 'inactive'))}>{location.is_active ? 'Active' : 'Inactive'}</Badge>
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
                            <DropdownMenuItem onSelect={() => router.push(`/dashboard/trip-locations/${location.id}`)}>
                                <View className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/dashboard/trip-locations/edit/${location.id}`)}>
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
                                This action cannot be undone. This will permanently delete the location "{location.name}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(location.id, location.name)} className="bg-destructive hover:bg-destructive/90">
                                {deletingId === location.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
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
        </Card>
    </div>
  );
}
