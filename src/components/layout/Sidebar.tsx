"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  PlusCircle,
  MapPin,
  CalendarDays,
  Book,
  Star,
  Settings,
  MountainSnow,
  ChevronDown,
  LayoutGrid
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

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid, subItems:[] },
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
  { title: 'Bookings', href: '/dashboard/bookings', icon: Book, subItems:[] },
  { title: 'Reviews', href: '/dashboard/reviews', icon: Star, subItems:[] },
];

const settingsNav: NavItem = { title: 'Settings', href: '/dashboard/settings', icon: Settings, subItems:[] };

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
  return (
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MountainSnow className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">TourVista</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <NavMenu items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={usePathname() === settingsNav.href}>
                  <Link href={settingsNav.href}>
                    <settingsNav.icon className="h-4 w-4" />
                    <span>{settingsNav.title}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}
