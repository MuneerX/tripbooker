
"use client";

import * as React from "react";
import { Book, MoreHorizontal, FilePenLine, Trash2, View, BookCheck, BookX, Clock, CheckCircle, ArrowUp, ArrowDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Booking, Operator } from "@/lib/types";
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
import { getBookings, getOperators } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";

type SortableKeys = 'tour_package.name' | 'booking_date' | 'total_amount' | 'booking_status';

export default function BookingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allBookings, setAllBookings] = React.useState<Booking[]>([]);
  const [allOperators, setAllOperators] = React.useState<Operator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemToDelete, setItemToDelete] = React.useState<Booking | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>(null);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const [bookings, operators] = await Promise.all([
        getBookings(),
        getOperators(),
      ]);
      setAllBookings(bookings);
      setAllOperators(operators);
      setLoading(false);
    };
    fetchInitialData();
  }, []);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig, startDate, endDate]);

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

  const handleExport = () => {
    if (loading || allBookings.length === 0) {
        toast({
            variant: "destructive",
            title: "Nothing to export",
            description: "There is no booking data available to export.",
        });
        return;
    }

    const agentMap = new Map(allOperators.map(op => [op.referral_code, op.name]).filter(([code]) => code));

    const headers = [
        "Order ID", "Tour Name", "Reservation Date", "Travel Date", 
        "Customer Name", "Customer Email", "Adults", "Children",
        "Total Amount", "Booking Status", "Payment Status", "Payment Method", "Transaction ID",
        "Referral Code", "Agent Name"
    ];

    const csvRows = [headers.join(",")];

    allBookings.forEach(booking => {
        const agentName = booking.referral_code ? agentMap.get(booking.referral_code) || "N/A" : "N/A";
        
        const row = [
            `"${booking.order_id || 'N/A'}"`,
            `"${booking.tour_package?.name?.replace(/"/g, '""') || 'N/A'}"`,
            `"${format(new Date(booking.booking_date), "yyyy-MM-dd")}"`,
            `"${booking.travel_date ? format(new Date(booking.travel_date), "yyyy-MM-dd") : 'N/A'}"`,
            `"${booking.customer?.full_name?.replace(/"/g, '""') || 'N/A'}"`,
            `"${booking.customer_email || 'N/A'}"`,
            booking.total_adults,
            booking.total_children,
            booking.total_amount,
            `"${booking.booking_status}"`,
            `"${booking.payment_status || 'N/A'}"`,
            `"${booking.payment_method || 'N/A'}"`,
            `"${booking.transaction_id || 'N/A'}"`,
            `"${booking.referral_code || 'N/A'}"`,
            `"${agentName.replace(/"/g, '""')}"`,
        ];
        
        csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
        title: "Export Successful",
        description: "Your booking data has been downloaded as a CSV file.",
    });
  };

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


  const filteredBookings = allBookings
    .filter((booking) =>
      booking.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tour_package?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((booking) => {
        if (!startDate && !endDate) return true;
        const bookingDate = new Date(booking.booking_date);
        if (startDate && bookingDate < new Date(startDate)) {
            return false;
        }
        if (endDate) {
            const to = new Date(endDate);
            to.setHours(23, 59, 59, 999);
            if (bookingDate > to) {
                return false;
            }
        }
        return true;
    });
  
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

  const sortedBookings = React.useMemo(() => {
    let sortableItems = [...filteredBookings];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);
        
        let aValue = getNestedValue(a, sortConfig.key);
        let bValue = getNestedValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (sortConfig.key === 'booking_date') {
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
  }, [filteredBookings, sortConfig]);

  const totalPages = Math.ceil(sortedBookings.length / rowsPerPage);
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalBookings = allBookings.length;
  const confirmedBookings = allBookings.filter(p => p.booking_status === 'confirmed').length;
  const pendingBookings = allBookings.filter(p => p.booking_status === 'pending').length;

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: <Book className="h-4 w-4" /> },
    { label: "Confirmed", value: confirmedBookings, icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    { label: "Pending", value: pendingBookings, icon: <Clock className="h-4 w-4 text-yellow-500" /> },
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
            <div className="flex w-full flex-col sm:flex-row items-center gap-2 sm:w-auto">
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <Input
                        type="date"
                        placeholder="From"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="date"
                        placeholder="To"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full"
                    />
                </div>
              <Input
                placeholder="Search by ID or Tour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Button onClick={handleExport} className="w-full sm:w-auto">
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading bookings...</div>
            ) : paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking: Booking) => (
                <Card key={booking.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="grid gap-1">
                        <CardTitle className="text-sm font-mono">{booking.order_id}</CardTitle>
                        <CardDescription className="line-clamp-1">{booking.tour_package?.name || 'N/A'}</CardDescription>
                      </div>
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
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm space-y-2">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span>{format(new Date(booking.booking_date), "dd MMM, yyyy")}</span>
                     </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span>{formatCurrency(booking.total_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className={cn("capitalize", getStatusBadgeColor(booking.booking_status))}>{booking.booking_status}</Badge>
                      </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">No bookings found.</div>
            )}
          </div>
          
          {/* Desktop view */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>
                  Order ID
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('tour_package.name')}>
                  <div className="flex items-center">Tour Name {renderSortArrow('tour_package.name')}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('booking_date')}>
                  <div className="flex items-center">Reservation Date {renderSortArrow('booking_date')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                   Transaction ID
                </TableHead>
                <TableHead className="hidden md:table-cell">
                   Payment
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('total_amount')}>
                   <div className="flex items-center">Amount {renderSortArrow('total_amount')}</div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                   Referral
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('booking_status')}>
                   <div className="flex items-center">Status {renderSortArrow('booking_status')}</div>
                </TableHead>
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
                  <TableRow key={booking.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}>
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
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedBookings.length}</strong> of <strong>{sortedBookings.length}</strong> bookings
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
