"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  TrendingUpIcon,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { BusinessUnitNav } from "@/components/layout/business-units-nav";
import { cn } from "@/lib/utils";

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  mode?: "org" | "business";
  businessUnitSlug?: string;
  businessUnitName?: string;
  userName?: string | null;
  userEmail?: string;
  businessUnits?: BusinessUnitNav[];
};

function NavItemLink({
  href,
  label,
  icon: Icon,
  exact,
  highlight = "page",
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  highlight?: "page" | "context";
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={highlight === "page" && active}
        tooltip={label}
        className={cn(
          highlight === "context" &&
            active &&
            "bg-sidebar-accent/40 font-normal text-sidebar-foreground ring-1 ring-sidebar-border data-[active=true]:font-normal"
        )}
      >
        <Link href={href}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavCollapsibleSection({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  const pathname = usePathname();
  const isSectionActive = items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <Collapsible defaultOpen={isSectionActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            isActive={isSectionActive}
            className={cn(
              isSectionActive &&
                "font-medium data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary"
            )}
          >
            <Icon />
            <span>{label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item) => {
              const ItemIcon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link href={item.href}>
                      <ItemIcon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar({
  mode = "business",
  businessUnitSlug = "",
  businessUnitName = "Multinegocios",
  userName,
  userEmail,
  businessUnits = [],
  ...props
}: AppSidebarProps) {
  const buSlug = businessUnitSlug;
  const incomeItems = [
    {
      href: `/${buSlug}/ingresos`,
      label: "Registro de ingresos",
      icon: TrendingUp,
    },
    {
      href: `/${buSlug}/configuracion/categorias-ingresos`,
      label: "Categorías de ingresos",
      icon: CircleDollarSign,
    },
    {
      href: `/${buSlug}/configuracion/productos`,
      label: "Catálogo de productos",
      icon: Package,
    },
  ];

  const costItems = [
    {
      href: `/${buSlug}/costos`,
      label: "Registro de costos",
      icon: TrendingDown,
    },
    {
      href: `/${buSlug}/configuracion/categorias-costos`,
      label: "Categorías de costos",
      icon: Receipt,
    },
  ];

  const user = {
    name: userName ?? "Usuario",
    email: userEmail ?? "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href={mode === "org" ? "/" : `/${buSlug}`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <TrendingUpIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Multinegocios</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {mode === "org" ? "Panel principal" : businessUnitName}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organización</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItemLink href="/" label="Panel principal" icon={LayoutGrid} exact />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {businessUnits.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Unidades de negocio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessUnits.map((unit) => (
                  <NavItemLink
                    key={unit.id}
                    href={`/${unit.slug}`}
                    label={unit.name}
                    icon={Building2}
                    highlight="context"
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {mode === "business" && buSlug && (
          <SidebarGroup>
            <SidebarGroupLabel>Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavItemLink
                  href={`/${buSlug}`}
                  label="Estadísticas"
                  icon={LayoutDashboard}
                  exact
                  highlight="page"
                />
                <NavCollapsibleSection
                  label="Ingresos"
                  icon={TrendingUp}
                  items={incomeItems}
                />
                <NavCollapsibleSection
                  label="Costos"
                  icon={TrendingDown}
                  items={costItems}
                />
                <NavItemLink
                  href={`/${buSlug}/configuracion/unidad`}
                  label="Unidad de negocio"
                  icon={Building2}
                  highlight="page"
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
