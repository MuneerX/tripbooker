"use client";

import { Bell, Menu, User, Book, Star, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from './Breadcrumbs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { getPendingBookings, getPendingReviews, getRecentOperators } from '@/lib/supabase/queries';
import type { Booking, Review, Operator } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppHeader() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [agents, setAgents] = React.useState<Operator[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
      }
      
      const [pendingBookings, pendingReviews, newAgents] = await Promise.all([
        getPendingBookings(),
        getPendingReviews(),
        getRecentOperators()
      ]);
      
      setBookings(pendingBookings);
      setReviews(pendingReviews);
      setAgents(newAgents);
    };
    fetchData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = profile?.full_name || 'Admin';
  const displayEmail = user?.email;
  const avatarUrl = profile?.avatar_url;
  
  const totalNotifications = bookings.length + reviews.length + agents.length;

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
                {totalNotifications > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]" variant="destructive">
                    {totalNotifications}
                </Badge>
                )}
                <span className="sr-only">Toggle notifications</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Alerts & Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {bookings.length > 0 && (
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/notifications?tab=bookings">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-full text-orange-600"><Book className="h-4 w-4" /></div>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">{bookings.length} Pending Booking(s)</p>
                                <p className="text-xs text-muted-foreground">New reservations awaiting approval.</p>
                            </div>
                        </div>
                    </Link>
                </DropdownMenuItem>
            )}

            {reviews.length > 0 && (
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/notifications?tab=reviews">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600"><Star className="h-4 w-4" /></div>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">{reviews.length} New Review(s)</p>
                                <p className="text-xs text-muted-foreground">Customer feedback needing moderation.</p>
                            </div>
                        </div>
                    </Link>
                </DropdownMenuItem>
            )}

            {agents.length > 0 && (
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/dashboard/notifications?tab=agents">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full text-green-600"><UserPlus className="h-4 w-4" /></div>
                            <div className="flex flex-col">
                                <p className="text-sm font-medium">{agents.length} New Agent(s)</p>
                                <p className="text-xs text-muted-foreground">Recent operator registrations.</p>
                            </div>
                        </div>
                    </Link>
                </DropdownMenuItem>
            )}

            {totalNotifications === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">All caught up! No new alerts.</div>
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
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
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
