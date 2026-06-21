"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getPageTitle } from "@/lib/nav-titles";

type SiteHeaderProps = {
  businessUnitName?: string;
  businessUnitSlug?: string;
};

export function SiteHeader({ businessUnitName, businessUnitSlug }: SiteHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear md:h-(--header-height)">
      <div className="flex w-full items-center gap-1.5 px-4 sm:px-6 lg:px-8 lg:gap-2">
        <SidebarTrigger className="-ml-1 size-9 [&_svg]:size-5 md:size-6 md:[&_svg]:size-3" />
        <Separator
          orientation="vertical"
          className="mx-1.5 data-[orientation=vertical]:h-5 md:mx-2 md:data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList className="text-sm md:text-xs">
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link href="/">Multinegocios</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {businessUnitName && businessUnitSlug && pathname !== "/" && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={`/${businessUnitSlug}`}>{businessUnitName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-base font-medium md:text-xs md:font-normal">
                {pageTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
