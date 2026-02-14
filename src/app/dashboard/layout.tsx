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

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbName, setBreadcrumbName }}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col bg-muted/40 gap-4 p-4 md:gap-8 md:p-8">
              {children}
            </main>
            <footer className="py-4 text-center text-xs text-muted-foreground shrink-0 border-t bg-muted/40">
              &copy; {new Date().getFullYear()} Matrimore Technologies. All rights reserved.
            </footer>
          </div>
        </div>
      </SidebarProvider>
    </BreadcrumbContext.Provider>
  );
}
