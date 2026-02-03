

"use client";

import { Bell, Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { getPendingBookings } from '@/lib/supabase/queries';
import type { Booking } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [notifications, setNotifications] = React.useState<Booking[]>([]);

  React.useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
      }
      
      const pendingBookings = await getPendingBookings();
      setNotifications(pendingBookings);
    };
    fetchUserAndNotifications();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = profile?.full_name || 'Admin';
  const displayEmail = user?.email;
  
  const recentNotifications = notifications.slice(0, 3);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 print:hidden lg:h-[60px] lg:px-6">
      <Button size="icon" variant="outline" onClick={toggleSidebar} className="shrink-0 md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      <div className="hidden flex-1 md:flex">
        <Breadcrumbs />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 md:ml-auto md:flex-initial">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]" variant="destructive">
                    {notifications.length}
                </Badge>
                )}
                <span className="sr-only">Toggle notifications</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentNotifications.length > 0 ? (
                recentNotifications.map(booking => (
                <DropdownMenuItem key={booking.id} asChild className="cursor-pointer">
                    <Link href={`/dashboard/bookings/${booking.id}`}>
                        <div className="flex flex-col">
                        <p className="text-sm font-medium">New Booking: {booking.order_id}</p>
                        <p className="text-xs text-muted-foreground">{booking.customer_name} booked {booking.tour_package?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}</p>
                        </div>
                    </Link>
                </DropdownMenuItem>
                ))
            ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">No new notifications</div>
            )}
            <DropdownMenuSeparator />
            <div className="p-1">
                <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/notifications">
                    View All Notifications
                </Link>
                </Button>
            </div>
            </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                    {displayEmail}
                </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ThemeToggle />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

    
