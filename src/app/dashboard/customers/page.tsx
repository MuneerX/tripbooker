
"use client";

import * as React from "react";
import { MoreHorizontal, UserCheck, UserX, Users, View } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/lib/types";
import { getStatusBadgeColor, cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/StatCard";
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
import { getProfiles, updateProfileStatus } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function CustomersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allProfiles, setAllProfiles] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemToToggle, setItemToToggle] = React.useState<Profile | null>(null);

  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const profiles = await getProfiles();
        setAllProfiles(profiles);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching customers",
          description: error.message,
        });
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [toast]);

  React.useEffect(() => {
    if (itemToToggle) {
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, [itemToToggle]);

  const handleStatusToggle = async () => {
    if (!itemToToggle) return;
    
    const newStatus = itemToToggle.status === 'active' ? 'blocked' : 'active';
    
    try {
        const updatedProfile = await updateProfileStatus(itemToToggle.id, newStatus);
        setAllProfiles(prev => prev.map(p => p.id === itemToToggle.id ? { ...p, status: updatedProfile.status } : p));
        toast({
            title: "Success",
            description: `Customer "${itemToToggle.full_name}" has been ${newStatus}.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error updating status",
            description: error.message,
        });
    } finally {
        setItemToToggle(null);
    }
  };

  const filteredProfiles = allProfiles.filter((profile) =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProfiles.length / rowsPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalCustomers = allProfiles.length;
  const activeCustomers = allProfiles.filter(p => p.status === 'active').length;
  const blockedCustomers = totalCustomers - activeCustomers;

  const stats = [
    { label: "Total Customers", value: totalCustomers, icon: <Users className="h-4 w-4" /> },
    { label: "Active", value: activeCustomers, icon: <UserCheck className="h-4 w-4" /> },
    { label: "Blocked", value: blockedCustomers, icon: <UserX className="h-4 w-4" /> },
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
              <CardTitle>All Customers</CardTitle>
              <CardDescription>Manage all registered customers.</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading customers...</div>
            ) : paginatedProfiles.length > 0 ? (
              paginatedProfiles.map((profile: Profile) => (
                <Card key={profile.id}>
                    <CardHeader className="p-4 cursor-pointer" onClick={() => router.push(`/dashboard/customers/${profile.id}`)}>
                         <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                  <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                                  <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">{profile.full_name || 'N/A'}</CardTitle>
                                    <CardDescription className="truncate">{profile.email || 'N/A'}</CardDescription>
                                </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onSelect={() => router.push(`/dashboard/customers/${profile.id}`)}>
                                    <View className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setItemToToggle(profile)}>
                                    {profile.status === 'active' ? (
                                        <><UserX className="mr-2 h-4 w-4" /> Block</>
                                    ) : (
                                        <><UserCheck className="mr-2 h-4 w-4" /> Unblock</>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm flex items-center justify-between">
                        <div className="text-muted-foreground">KV Customer: <span className="font-medium text-foreground">{profile.is_kv_customer ? 'Yes' : 'No'}</span></div>
                        <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(profile.status === 'active' ? 'active' : 'inactive'))}>{profile.status}</Badge>
                    </CardContent>
                </Card>
              ))
            ) : (
               <div className="text-center py-10 text-muted-foreground">No customers found.</div>
            )}
          </div>
          
          {/* Desktop view */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead>KV Customer</TableHead>
                <TableHead>Status</TableHead>
                 <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : paginatedProfiles.length > 0 ? (
                paginatedProfiles.map((profile: Profile) => (
                  <TableRow key={profile.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/customers/${profile.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || ''} />
                          <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{profile.full_name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{profile.email || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{profile.phone_number || 'N/A'}</TableCell>
                    <TableCell>{profile.is_kv_customer ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(profile.status === 'active' ? 'active' : 'inactive'))}>{profile.status}</Badge>
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
                          <DropdownMenuItem onSelect={() => router.push(`/dashboard/customers/${profile.id}`)}>
                            <View className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setItemToToggle(profile)}>
                            {profile.status === 'active' ? (
                                <>
                                    <UserX className="mr-2 h-4 w-4" /> Block
                                </>
                            ) : (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4" /> Unblock
                                </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedProfiles.length}</strong> of <strong>{filteredProfiles.length}</strong> customers
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

      {itemToToggle && (
        <AlertDialog open={!!itemToToggle} onOpenChange={(open) => !open && setItemToToggle(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will {itemToToggle.status === 'active' ? 'block' : 'unblock'} the customer "{itemToToggle.full_name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToToggle(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStatusToggle} className={cn(itemToToggle.status === 'active' && "bg-destructive hover:bg-destructive/90")}>
                {itemToToggle.status === 'active' ? 'Block' : 'Unblock'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
