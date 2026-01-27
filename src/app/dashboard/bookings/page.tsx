
"use client";

import * as React from "react";
import { Book, MoreHorizontal, FilePenLine, Trash2, View, BookCheck, BookX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Booking } from "@/lib/types";
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
import { getBookings } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";

export default function BookingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allBookings, setAllBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemToDelete, setItemToDelete] = React.useState<Booking | null>(null);

  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const bookings = await getBookings();
      console.log('Fetched Bookings:', bookings); // Console log for debugging
      setAllBookings(bookings);
      setLoading(false);
    };
    fetchBookings();
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
    
    // In a real app, you would call a delete function here
    // For now, we will just filter it out from the state
    
    toast({
      title: "Success",
      description: `Booking "${itemToDelete.order_id}" has been notionally deleted.`,
    });
    setAllBookings(prev => prev.filter(b => b.id !== itemToDelete.id));
    setItemToDelete(null);
  };


  const filteredBookings = allBookings.filter((booking) =>
    booking.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.tour_package?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalBookings = allBookings.length;
  const confirmedBookings = allBookings.filter(p => p.booking_status === 'confirmed').length;
  const pendingBookings = allBookings.filter(p => p.booking_status === 'pending').length;

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: <Book className="h-4 w-4" /> },
    { label: "Confirmed", value: confirmedBookings, icon: <BookCheck className="h-4 w-4" /> },
    { label: "Pending", value: pendingBookings, icon: <BookX className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {stats.map(stat => <StatCard key={stat.label} card={stat} />)}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Manage all customer bookings from here.</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                placeholder="Search by ID or Tour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Tour Name</TableHead>
                <TableHead>Reservation Date</TableHead>
                <TableHead className="hidden md:table-cell">Transaction ID</TableHead>
                <TableHead className="hidden md:table-cell">Payment</TableHead>
                <TableHead className="hidden md:table-cell">Amount</TableHead>
                <TableHead className="hidden lg:table-cell">Referral</TableHead>
                <TableHead>Status</TableHead>
                 <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Loading bookings...
                  </TableCell>
                </TableRow>
              ) : paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking: Booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.order_id}</TableCell>
                    <TableCell className="font-medium">{booking.tour_package?.name || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(booking.booking_date), "dd MMM, yyyy")}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{booking.transaction_id || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{booking.payment_method || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCurrency(booking.total_amount)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking.referral_code || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", getStatusBadgeColor(booking.booking_status))}>{booking.booking_status}</Badge>
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
                          <DropdownMenuItem onSelect={() => router.push(`/dashboard/bookings/${booking.id}`)}>
                            <View className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onSelect={() => setItemToDelete(booking)}
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
                  <TableCell colSpan={9} className="h-24 text-center">
                    No bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedBookings.length}</strong> of <strong>{filteredBookings.length}</strong> bookings
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
                This action cannot be undone. This will permanently delete the booking "{itemToDelete.order_id}".
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
