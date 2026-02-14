"use client";

import * as React from "react";
import { usePathname } from 'next/navigation';
import { AppHeader } from "@/components/layout/Header";
import { AppSidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Create a context to share the breadcrumb name
const BreadcrumbContext = React.createContext({
  breadcrumbName: '',
  setBreadcrumbName: (name: string) => {},
});

export const useBreadcrumb = () => React.useContext(BreadcrumbContext);

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [breadcrumbName, setBreadcrumbName] = React.useState('');
  const pathname = usePathname();

  const isCharterPage = pathname === '/dashboard/charter-tours';

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbName, setBreadcrumbName }}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className={cn(
              "flex flex-1 flex-col bg-muted/40",
              isCharterPage ? "overflow-hidden" : "gap-4 p-4 md:gap-8 md:p-8"
            )}>
              <div className={cn("flex-1", isCharterPage ? "" : "")}>
                {children}
              </div>
               <footer className={cn(
                 "text-center text-xs text-muted-foreground shrink-0",
                 isCharterPage ? "py-4 border-t" : "pt-8"
               )}>
                &copy; {new Date().getFullYear()} Matrimore Technologies. All rights reserved.
              </footer>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BreadcrumbContext.Provider>
  );
}
