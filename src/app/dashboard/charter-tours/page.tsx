"use client";

import * as React from "react";
import { MoreHorizontal, Users, View, User, Phone, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { CharterTour } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { getCharterTours } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';

type SortableKeys = 'name' | 'email' | 'created_at' | 'travel_purpose';

export default function CharterToursPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allTours, setAllTours] = React.useState<CharterTour[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>(null);

  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchTours = async () => {
      setLoading(true);
      try {
        const tours = await getCharterTours();
        setAllTours(tours);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching inquiries",
          description: error.message,
        });
      }
      setLoading(false);
    };
    fetchTours();
  }, [toast]);
  
  const filteredTours = allTours.filter((tour) =>
      (tour.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tour.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (tour.travel_purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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

  const sortedTours = React.useMemo(() => {
    let sortableItems = [...filteredTours];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof CharterTour] as any;
        const bValue = b[sortConfig.key as keyof CharterTour] as any;

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
  }, [filteredTours, sortConfig]);

  const totalPages = Math.ceil(sortedTours.length / rowsPerPage);
  const paginatedTours = sortedTours.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const stats = [
    { label: "Total Inquiries", value: allTours.length, icon: <Users className="h-4 w-4" /> },
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
              <CardTitle>Charter Tour Inquiries</CardTitle>
              <CardDescription>Manage all charter tour inquiries from customers.</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                placeholder="Search inquiries..."
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
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Customer {renderSortArrow('name')}</div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('travel_purpose')}>
                   <div className="flex items-center">Purpose {renderSortArrow('travel_purpose')}</div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                   Guests
                </TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer hover:bg-muted" onClick={() => handleSort('created_at')}>
                   <div className="flex items-center">Inquiry Date {renderSortArrow('created_at')}</div>
                </TableHead>
                 <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading inquiries...
                  </TableCell>
                </TableRow>
              ) : paginatedTours.length > 0 ? (
                paginatedTours.map((tour: CharterTour) => (
                  <TableRow key={tour.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/charter-tours/${tour.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={tour.avatar_url || ''} alt={tour.name || ''} />
                          <AvatarFallback>{tour.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{tour.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{tour.email || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tour.travel_purpose || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{ (tour.number_of_adults || 0) + (tour.number_of_children || 0) }</TableCell>
                    <TableCell className="hidden lg:table-cell">{tour.created_at ? format(new Date(tour.created_at), "PPP") : 'N/A'}</TableCell>
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
                          <DropdownMenuItem onSelect={() => router.push(`/dashboard/charter-tours/${tour.id}`)}>
                            <View className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No inquiries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedTours.length}</strong> of <strong>{sortedTours.length}</strong> inquiries
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
    </div>
  );
}
