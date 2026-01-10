
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, UserCheck, UserX, Mail, Phone, MessageSquare, MapPin, Building, Hash, Calendar, VenetianMask, User } from "lucide-react";
import { getStatusBadgeColor, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { format, isValid } from "date-fns";
import { getProfileById } from "@/lib/supabase/queries";
import type { Profile } from "@/lib/types";
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

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };
  const { toast } = useToast();
  const { setBreadcrumbName } = useBreadcrumb();

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      const fetchProfile = async () => {
        setLoading(true);
        const data = await getProfileById(id as string);
        if (data) {
          setProfile(data);
          setBreadcrumbName(data.full_name || 'Customer');
        } else {
          toast({ variant: "destructive", title: "Error", description: "Customer not found." });
          setBreadcrumbName('Not Found');
          router.push('/dashboard/customers');
        }
        setLoading(false);
      };
      fetchProfile();
    }
     // Clear on unmount
    return () => setBreadcrumbName('');
  }, [id, router, toast, setBreadcrumbName]);

  const handleStatusToggle = async () => {
    if (!profile) return;
    
    // NOTE: This is a mock implementation for the UI.
    // In a real app, you would call an update function here.
    const newStatus = profile.status === 'active' ? 'blocked' : 'active';
    setProfile({ ...profile, status: newStatus });
    
    toast({
      title: "Success",
      description: `Customer "${profile.full_name}" has been ${newStatus}.`,
    });
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">Loading Customer Details...</h1>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }
  
  const formattedDob = profile.dob && isValid(new Date(profile.dob)) ? format(new Date(profile.dob), "PPP") : 'N/A';

  return (
    <div className="space-y-6">
      <AlertDialog>
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <Avatar className="h-12 w-12 border">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'customer'} />
                <AvatarFallback>{profile.full_name?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {profile.full_name}
            </h1>
            <div className="ml-auto flex items-center gap-2">
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                       {profile.status === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                       {profile.status === 'active' ? 'Block' : 'Unblock'}
                    </Button>
                </AlertDialogTrigger>
                <Button size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <Avatar className="h-40 w-40 border-4 border-primary/20">
                                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'customer'} className="object-cover" />
                                <AvatarFallback className="text-6xl">{profile.full_name?.charAt(0) || 'C'}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                        </div>
                        <Separator/>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-muted-foreground">Date of Birth</p>
                                    <p>{formattedDob}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <VenetianMask className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-muted-foreground">Gender</p>
                                    <p className="capitalize">{profile.gender || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-muted-foreground">KV Customer</p>
                                    <p>{profile.is_kv_customer ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader><CardTitle>Contact & Address Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{profile.email || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Phone Number</p><p className="font-medium">{profile.phone_number || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><MessageSquare className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">WhatsApp Number</p><p className="font-medium">{profile.whatsapp_number || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Address</p><p className="font-medium">{profile.address || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><Building className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">City</p><p className="font-medium">{profile.city || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><Building className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">District</p><p className="font-medium">{profile.district || 'N/A'}</p></div></div>
                        <div className="flex items-start gap-3"><Hash className="h-5 w-5 text-muted-foreground mt-1" /><div><p className="text-sm text-muted-foreground">Pincode</p><p className="font-medium">{profile.pincode || 'N/A'}</p></div></div>
                         <div className="flex items-start gap-3"><UserX className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant="outline" className={cn("capitalize mt-1", getStatusBadgeColor(profile.status === 'active' ? 'active' : 'inactive'))}>{profile.status}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {profile.status === 'active' ? 'block' : 'unblock'} the customer "{profile.full_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} className={cn(profile.status === 'active' && "bg-destructive hover:bg-destructive/90")}>
              {profile.status === 'active' ? 'Block' : 'Unblock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
