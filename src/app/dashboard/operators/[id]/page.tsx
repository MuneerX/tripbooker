"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, UserCheck, UserX, Mail, Phone, Hash, UserCog, Building, Contact, Check, ShieldCheck, Percent, DollarSign, Calendar, Clock, ArrowUp, ArrowDown, MoreHorizontal, Search } from "lucide-react";
import { cn, formatCurrency, getStatusBadgeColor } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { getOperatorById, updateOperatorStatus, getAgentCommissions, updateCommissionStatus } from "@/lib/supabase/queries";
import type { Operator, AgentCommission } from "@/lib/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumb } from "../../layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

type SortableKeys = 'created_at' | 'booking.order_id' | 'tour_package.name' | 'booking_amount' | 'commission_amount' | 'commission_status';

export default function OperatorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();

  const [operator, setOperator] = React.useState<Operator | null>(null);
  const [commissions, setCommissions] = React.useState<AgentCommission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
        const [opData, commData] = await Promise.all([
            getOperatorById(id as string),
            getAgentCommissions(id as string)
        ]);

        if (opData) {
          setOperator(opData);
          setBreadcrumbName(opData.name || 'Agent');
        } else {
          toast({ variant: "destructive", title: "Error", description: "Agent not found." });
          setBreadcrumbName('Not Found');
          router.push('/dashboard/operators');
        }
        
        setCommissions(commData);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setLoading(false);
    }
  }, [id, router, toast, setBreadcrumbName]);

  React.useEffect(() => {
    fetchData();
    return () => setBreadcrumbName('');
  }, [fetchData, setBreadcrumbName]);

  const handleStatusToggle = async () => {
    if (!operator) return;
    
    const newStatus = operator.status === 'active' ? 'blocked' : 'active';
    
    try {
        const updatedOperator = await updateOperatorStatus(operator.id, newStatus);
        setOperator(updatedOperator);
        toast({
            title: "Success",
            description: `Agent "${operator.name}" has been ${newStatus}.`,
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to ${newStatus} agent.`,
        });
    }
  };

  const handleCommissionStatusUpdate = async (commId: string, status: string) => {
    try {
        await updateCommissionStatus(commId, status);
        toast({ title: "Success", description: `Commission status updated to ${status}.` });
        fetchData(); // Refresh list
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update commission status." });
    }
  };

  const commissionStats = React.useMemo(() => {
    const totalEarned = commissions.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
    const totalPending = commissions
        .filter(c => c.commission_status === 'pending')
        .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
    const totalBookings = commissions.length;
    
    return { totalEarned, totalPending, totalBookings };
  }, [commissions]);

  const filteredAndSortedCommissions = React.useMemo(() => {
    let result = commissions.filter(comm => 
        (comm.booking?.order_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (comm.tour_package?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig) {
        result.sort((a, b) => {
            const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);
            let aValue = getNestedValue(a, sortConfig.key);
            let bValue = getNestedValue(b, sortConfig.key);

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

    return result;
  }, [commissions, searchTerm, sortConfig]);

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

  if (loading || !operator) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Loading Agent Details...</h1>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <AlertDialog>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {operator.name}
            </h1>
            <div className="flex w-full flex-col items-stretch gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                       {operator.status === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                       {operator.status === 'active' ? 'Block' : 'Unblock'}
                    </Button>
                </AlertDialogTrigger>
                <Button size="sm" asChild>
                    <Link href={`/dashboard/operators/edit/${operator.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <Avatar className="h-40 w-40 border-4 border-primary/20">
                                <AvatarImage src={operator.logo_url || ''} alt={operator.name || 'logo'}/>
                                <AvatarFallback className="text-6xl">{operator.name?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{operator.name}</h2>
                        </div>
                        <Separator/>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-2">
                                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium text-muted-foreground">Agent Code</p>
                                    <p>{operator.code || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <UserCog className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium text-muted-foreground">Referral Code</p>
                                    <p>{operator.referral_code || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 col-span-2">
                                <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium text-muted-foreground">Verified</p>
                                    <p>{operator.is_verified ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact & Address Details</CardTitle>
                        <CardDescription>{operator.description || 'No description provided.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <div className="flex items-start gap-3"><Contact className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Contact Person</p><p className="font-medium">{operator.contact_person || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{operator.email || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Phone Number</p><p className="font-medium">{operator.phone || 'N/A'}</p></div></div>
                         <div className="flex items-start gap-3 md:col-span-2"><Building className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Address</p><p className="font-medium">{operator.address || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3">
                           <UserX className="h-5 w-5 text-muted-foreground mt-1" />
                           <div>
                               <p className="text-sm text-muted-foreground">Status</p>
                               <Badge variant="outline" className={cn("capitalize mt-1", operator.status === 'active' ? 'text-green-600 border-green-600/20 bg-green-500/10' : 'text-red-600 border-red-600/20 bg-red-500/10')}>{operator.status}</Badge>
                           </div>
                       </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Commission Summary</CardTitle>
                        <CardDescription>Overall performance and earnings for this agent.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Earned</p>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(commissionStats.totalEarned)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(commissionStats.totalPending)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Percent className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Referred Bookings</p>
                                <p className="text-xl font-bold">{commissionStats.totalBookings}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Card className="mt-8">
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle>Commission History</CardTitle>
                        <CardDescription>Detailed list of all commissions earned by this agent.</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by Order ID or Package..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredAndSortedCommissions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center">Date {renderSortArrow('created_at')}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('booking.order_id')}>
                                    <div className="flex items-center">Order ID {renderSortArrow('booking.order_id')}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('tour_package.name')}>
                                    <div className="flex items-center">Package {renderSortArrow('tour_package.name')}</div>
                                </TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-muted" onClick={() => handleSort('booking_amount')}>
                                    <div className="flex items-center justify-end">Booking Amt {renderSortArrow('booking_amount')}</div>
                                </TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead className="text-right cursor-pointer hover:bg-muted" onClick={() => handleSort('commission_amount')}>
                                    <div className="flex items-center justify-end">Earned {renderSortArrow('commission_amount')}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('commission_status')}>
                                    <div className="flex items-center">Status {renderSortArrow('commission_status')}</div>
                                </TableHead>
                                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedCommissions.map((comm) => (
                                <TableRow key={comm.id}>
                                    <TableCell className="text-xs">{format(new Date(comm.created_at), "dd MMM yyyy")}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        <Link href={`/dashboard/bookings/${comm.booking_id}`} className="hover:underline text-primary">
                                            #{comm.booking?.order_id || 'N/A'}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {comm.tour_package?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(Number(comm.booking_amount) || 0)}</TableCell>
                                    <TableCell className="text-xs">
                                        {comm.commission_type === 'percentage' ? `${comm.commission_value}%` : formatCurrency(Number(comm.commission_value) || 0)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {formatCurrency(Number(comm.commission_amount) || 0)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("capitalize", getStatusBadgeColor(comm.commission_status as any))}>
                                            {comm.commission_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleCommissionStatusUpdate(comm.id, 'pending')}>Mark as Pending</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCommissionStatusUpdate(comm.id, 'approved')}>Mark as Approved</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleCommissionStatusUpdate(comm.id, 'transferred')}>Mark as Transferred</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleCommissionStatusUpdate(comm.id, 'cancelled')} className="text-red-600">Cancel Commission</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="py-12 text-center text-muted-foreground">
                        No commission history found matching your criteria.
                    </div>
                )}
            </CardContent>
        </Card>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {operator.status === 'active' ? 'block' : 'unblock'} the agent "{operator.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} className={cn(operator.status === 'active' && "bg-destructive hover:bg-destructive/90")}>
              {operator.status === 'active' ? 'Block' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}