
"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, UserCheck, UserX, Users, View, PlusCircle, FilePenLine, Trash2, UserCog, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Operator } from "@/lib/types";
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
import { getOperators, deleteOperator, updateOperatorStatus } from "@/lib/supabase/queries";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

type SortableKeys = 'name' | 'status';

export default function OperatorsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [allOperators, setAllOperators] = React.useState<Operator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemToToggle, setItemToToggle] = React.useState<Operator | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<Operator | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>(null);

  const rowsPerPage = 10;

  React.useEffect(() => {
    const fetchOperators = async () => {
      setLoading(true);
      try {
        const operators = await getOperators();
        setAllOperators(operators);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching agents",
          description: error.message,
        });
      }
      setLoading(false);
    };
    fetchOperators();
  }, [toast]);

  React.useEffect(() => {
    const isModalOpen = !!itemToToggle || !!itemToDelete;
    if (isModalOpen) {
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.pointerEvents = '';
    };
  }, [itemToToggle, itemToDelete]);

  const handleStatusToggle = async () => {
    if (!itemToToggle) return;
    
    const newStatus = itemToToggle.status === 'active' ? 'blocked' : 'active';
    
    try {
        const updatedOperator = await updateOperatorStatus(itemToToggle.id, newStatus);
        setAllOperators(prev => prev.map(p => p.id === itemToToggle.id ? { ...p, status: updatedOperator.status, is_active: updatedOperator.is_active } : p));
        toast({
            title: "Success",
            description: `Agent "${itemToToggle.name}" has been ${newStatus}.`,
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

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
        await deleteOperator(itemToDelete.id);
        setAllOperators(prev => prev.filter(op => op.id !== itemToDelete.id));
        toast({
            title: "Success",
            description: `Agent "${itemToDelete.name}" has been deleted.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error deleting agent",
            description: error.message,
        });
    } finally {
        setItemToDelete(null);
    }
  };

  const filteredOperators = allOperators.filter((operator) =>
    operator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.code?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const sortedOperators = React.useMemo(() => {
    let sortableItems = [...filteredOperators];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
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
  }, [filteredOperators, sortConfig]);

  const totalPages = Math.ceil(sortedOperators.length / rowsPerPage);
  const paginatedOperators = sortedOperators.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalOperators = allOperators.length;
  const activeOperators = allOperators.filter(p => p.is_active).length;
  const blockedOperators = totalOperators - activeOperators;

  const stats = [
    { label: "Total Agents", value: totalOperators, icon: <UserCog className="h-4 w-4" /> },
    { label: "Active", value: activeOperators, icon: <UserCheck className="h-4 w-4" /> },
    { label: "Blocked", value: blockedOperators, icon: <UserX className="h-4 w-4" /> },
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
              <CardTitle>All Agents</CardTitle>
              <CardDescription>Manage all registered tour agents.</CardDescription>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input
                placeholder="Search by name, email, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button asChild>
                <Link href="/dashboard/operators/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Agent
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view */}
          <div className="grid gap-4 md:hidden">
            {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading agents...</div>
            ) : paginatedOperators.length > 0 ? (
              paginatedOperators.map((operator: Operator) => (
                <Card key={operator.id}>
                    <CardHeader className="p-4 cursor-pointer" onClick={() => router.push(`/dashboard/operators/${operator.id}`)}>
                         <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={operator.logo_url || ''} alt={operator.name || ''} />
                                  <AvatarFallback>{operator.name?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{operator.name || 'N/A'}</CardTitle>
                                    <CardDescription>{operator.email || 'N/A'}</CardDescription>
                                </div>
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
                                    <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); router.push(`/dashboard/operators/${operator.id}`)}}>
                                      <View className="mr-2 h-4 w-4" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); router.push(`/dashboard/operators/edit/${operator.id}`)}}>
                                      <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); setItemToToggle(operator)}}>
                                      {operator.status === 'active' ? (
                                          <><UserX className="mr-2 h-4 w-4" /> Block</>
                                      ) : (
                                          <><UserCheck className="mr-2 h-4 w-4" /> Unblock</>
                                      )}
                                    </DropdownMenuItem>
                                     <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                      onSelect={(e) => {e.stopPropagation(); setItemToDelete(operator)}}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm flex items-center justify-between">
                         <div className="text-muted-foreground">Ref: <span className="font-medium text-foreground font-mono text-xs">{operator.referral_code || 'N/A'}</span></div>
                        <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(operator.status === 'active' ? 'active' : 'inactive'))}>{operator.status}</Badge>
                    </CardContent>
                </Card>
              ))
            ) : (
               <div className="text-center py-10 text-muted-foreground">No agents found.</div>
            )}
          </div>

          {/* Desktop view */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Agent {renderSortArrow('name')}</div>
                </TableHead>
                <TableHead>
                  Referral Code
                </TableHead>
                <TableHead>
                  Agent Code
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Email
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Phone
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('status')}>
                  <div className="flex items-center">Status {renderSortArrow('status')}</div>
                </TableHead>
                 <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading agents...
                  </TableCell>
                </TableRow>
              ) : paginatedOperators.length > 0 ? (
                paginatedOperators.map((operator: Operator) => (
                  <TableRow key={operator.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/operators/${operator.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={operator.logo_url || ''} alt={operator.name || ''} />
                          <AvatarFallback>{operator.name?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{operator.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{operator.referral_code || 'N/A'}</TableCell>
                    <TableCell>{operator.code || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">{operator.email || 'N/A'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{operator.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(operator.status === 'active' ? 'active' : 'inactive'))}>{operator.status}</Badge>
                    </TableCell>
                     <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); router.push(`/dashboard/operators/${operator.id}`)}}>
                            <View className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); router.push(`/dashboard/operators/edit/${operator.id}`)}}>
                            <FilePenLine className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => {e.stopPropagation(); setItemToToggle(operator)}}>
                            {operator.status === 'active' ? (
                                <><UserX className="mr-2 h-4 w-4" /> Block</>
                            ) : (
                                <><UserCheck className="mr-2 h-4 w-4" /> Unblock</>
                            )}
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onSelect={(e) => {e.stopPropagation(); setItemToDelete(operator)}}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    No agents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedOperators.length}</strong> of <strong>{sortedOperators.length}</strong> agents
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
                This will {itemToToggle.status === 'active' ? 'block' : 'unblock'} the agent "{itemToToggle.name}".
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

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the agent "{itemToDelete.name}".
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

    