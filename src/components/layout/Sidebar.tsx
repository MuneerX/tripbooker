

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
  Plane,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    title: 'Charter Tours',
    href: '/dashboard/charter-tours',
    icon: Plane,
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
  const activeItemValue = items.find(item => item.subItems && item.subItems.length > 0 && pathname.startsWith(item.href))?.title;

  return (
    <div className="flex flex-col gap-1 w-full">
      <Accordion type="single" collapsible className="w-full" defaultValue={activeItemValue}>
        {items.map((item) => (
          item.subItems && item.subItems.length > 0 ? (
            <AccordionItem value={item.title} key={item.title} className="border-none">
              <AccordionTrigger className="p-0 hover:no-underline rounded-md hover:bg-sidebar-accent" asChild>
                <div className="group/menu-item relative flex w-full items-center">
                  <SidebarMenuButton className="w-full justify-start pr-8" isActive={pathname.startsWith(item.href)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-1">
                <ul className="mx-3.5 my-1 list-none space-y-1 border-l border-sidebar-border/30 px-2.5 py-1">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.title}>
                      <SidebarMenuButton asChild isActive={pathname === subItem.href} className="h-8 justify-start text-sm w-full">
                        <Link href={subItem.href}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ) : (
            <SidebarMenuButton asChild isActive={pathname === item.href} key={item.title} className="w-full">
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          )
        ))}
      </Accordion>
    </div>
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
            {mounted && <Image src={logoUrl} alt="Yes To Go Logo" width={120} height={32} />}
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 overflow-y-auto">
          <NavMenu items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuItem>
                <div className="flex items-center justify-center p-1 opacity-75 group-data-[collapsible=icon]:hidden">
                    <a href="https://matrimore.com/" target="_blank" rel="noopener noreferrer">
                    <Image src="https://i.ibb.co/PvP7hVCn/photo-2026-02-08-19-05-02-Edited.png" alt="Matrimore Logo" width={120} height={30} />
                    </a>
                </div>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <logoutNav.icon className="h-4 w-4" />
                  <span>{logoutNav.title}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>
  );
}

    