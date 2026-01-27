
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, UserCheck, UserX, Mail, Phone, Hash, UserCog, Building, Contact, Check, ShieldCheck, Percent, DollarSign } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { getOperatorById, updateOperatorStatus } from "@/lib/supabase/queries";
import type { Operator } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumb } from "../../layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function OperatorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();

  const [operator, setOperator] = React.useState<Operator | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      const fetchOperator = async () => {
        setLoading(true);
        const data = await getOperatorById(id as string);
        if (data) {
          setOperator(data);
          setBreadcrumbName(data.name || 'Agent');
        } else {
          toast({ variant: "destructive", title: "Error", description: "Agent not found." });
          setBreadcrumbName('Not Found');
          router.push('/dashboard/operators');
        }
        setLoading(false);
      };
      fetchOperator();
    }
    return () => setBreadcrumbName('');
  }, [id, router, toast, setBreadcrumbName]);

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
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {operator.name}
            </h1>
            <div className="ml-auto flex items-center gap-2">
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
                        <CardTitle>Agent Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {operator.commission_status ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{operator.commission_type === 'percentage' ? <Percent className="h-5 w-5 text-muted-foreground" /> : <DollarSign className="h-5 w-5 text-muted-foreground" />}</div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Commission Type</p>
                                        <p className="font-medium capitalize">{operator.commission_type}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{operator.commission_type === 'percentage' ? <Percent className="h-5 w-5 text-muted-foreground" /> : <DollarSign className="h-5 w-5 text-muted-foreground" />}</div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Commission Value</p>
                                        <p className="font-medium">
                                            {operator.commission_type === 'percentage'
                                                ? `${operator.commission_value}%`
                                                : formatCurrency(operator.commission_value)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Agent commission is not enabled for this agent.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>

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
