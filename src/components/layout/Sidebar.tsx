"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  Package,
  PlusCircle,
  MapPin,
  CalendarDays,
  LogOut,
  MountainSnow,
  ChevronDown,
  LayoutGrid,
  Book,
  Users,
  UserCog,
  Bell,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { NavItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid, subItems:[] },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    subItems: [],
  },
  {
    title: 'Bookings',
    href: '/dashboard/bookings',
    icon: Book,
    subItems: [],
  },
   {
    title: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    subItems: [],
  },
  {
    title: 'Tour Packages',
    href: '/dashboard/tour-packages',
    icon: Package,
    subItems: [
      { title: 'All Packages', href: '/dashboard/tour-packages', icon: Package },
      { title: 'Create New', href: '/dashboard/tour-packages/create', icon: PlusCircle },
    ],
  },
  {
    title: 'Trip Days',
    href: '/dashboard/trip-days',
    icon: CalendarDays,
    subItems: [
      { title: 'All Trip Days', href: '/dashboard/trip-days', icon: CalendarDays },
      { title: 'Create New', href: '/dashboard/trip-days/create', icon: PlusCircle },
    ],
  },
  {
    title: 'Trip Locations',
    href: '/dashboard/trip-locations',
    icon: MapPin,
    subItems: [
      { title: 'All Locations', href: '/dashboard/trip-locations', icon: MapPin },
      { title: 'Create New', href: '/dashboard/trip-locations/create', icon: PlusCircle },
    ],
  },
  {
    title: 'Agents',
    href: '/dashboard/operators',
    icon: UserCog,
    subItems: [
      { title: 'All Agents', href: '/dashboard/operators', icon: UserCog },
      { title: 'Create New', href: '/dashboard/operators/create', icon: PlusCircle },
    ],
  },
];

const logoutNav: NavItem = { title: 'Logout', href: '/login', icon: LogOut, subItems:[] };

function NavMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) =>
        item.subItems && item.subItems.length > 0 ? (
          <Collapsible asChild key={item.title} defaultOpen={pathname.startsWith(item.href)}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                  <div className="group/menu-item relative flex w-full items-center">
                      <SidebarMenuButton className="w-full justify-start pr-8" isActive={pathname.startsWith(item.href)}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                      </SidebarMenuButton>
                      <ChevronDown className="absolute right-2 top-1.5 h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 text-sidebar-foreground group-hover/menu-item:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" />
                  </div>
              </CollapsibleTrigger>
              <CollapsibleContent asChild>
                <SidebarMenu className="mx-3.5 my-1 flex-col items-stretch border-l border-sidebar-border/30 px-2.5 py-1">
                  {item.subItems.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton asChild isActive={pathname === subItem.href} className="h-8 justify-start text-sm">
                        <Link href={subItem.href}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={pathname === item.href}>
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      )}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    // In a real app, you would handle logout logic here (e.g., clearing session, calling Firebase signOut)
    router.push(logoutNav.href);
  };
  
  const logoUrl = theme === 'dark' 
    ? "https://i.ibb.co/7xpjJbKh/logoy2go-white.png" 
    : "https://i.ibb.co/VpQvKQ2X/logoy2go.png";

  return (
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center justify-center gap-2 py-2">
            {mounted && <Image src={logoUrl} alt="Yes To Go Logo" width={150} height={150} />}
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <NavMenu items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <logoutNav.icon className="h-4 w-4" />
                  <span>{logoutNav.title}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}
