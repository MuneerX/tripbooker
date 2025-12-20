
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumb } from '@/app/dashboard/layout';

export function Breadcrumbs() {
  const pathname = usePathname();
  const { breadcrumbName } = useBreadcrumb();
  const pathSegments = pathname.split('/').filter(segment => segment);
  
  const isDetailPage = pathSegments.length > 2 && (pathSegments[pathSegments.length - 2] === 'edit' || /^[a-z0-9-]+$/.test(pathSegments[pathSegments.length-1]));
  const isCreatePage = pathSegments[pathSegments.length - 1] === 'create';

  const segmentsToRender = (isDetailPage || isCreatePage) ? pathSegments.slice(1, -1) : pathSegments.slice(1);

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
        {segmentsToRender.map((segment, index) => {
          const href = `/` + pathSegments.slice(0, index + 2).join('/');
          const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
              <li>
                <Link href={href} className="text-muted-foreground hover:text-foreground">
                  {name}
                </Link>
              </li>
            </React.Fragment>
          );
        })}
        {isCreatePage && (
             <React.Fragment>
                <li className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
                <li>
                    <span className="font-medium text-foreground">
                        Create
                    </span>
                </li>
            </React.Fragment>
        )}
        {isDetailPage && breadcrumbName && (
          <React.Fragment>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
            <li>
              <span className="font-medium text-foreground truncate max-w-48">
                {breadcrumbName}
              </span>
            </li>
          </React.Fragment>
        )}
      </ol>
    </nav>
  );
}
