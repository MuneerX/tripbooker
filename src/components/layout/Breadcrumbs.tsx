"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(segment => segment);
  
  if (pathSegments.length <= 1) {
    return <div className="hidden md:flex font-semibold text-lg">Dashboard</div>;
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </li>
        {pathSegments.slice(1).map((segment, index) => {
          const isLast = index === pathSegments.length - 2;
          const href = `/` + pathSegments.slice(0, index + 2).join('/');
          const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-medium text-foreground">{name}</span>
                ) : (
                  <Link href={href} className="text-muted-foreground hover:text-foreground">
                    {name}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
