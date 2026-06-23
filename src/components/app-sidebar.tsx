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
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  TrendingUpIcon,
  Users,
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
import { BusinessUnitIcon } from "@/components/shared/business-unit-icon";
import { cn } from "@/lib/utils";
import { isViewerRole } from "@/lib/permissions";

export type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  mode?: "org" | "business";
  businessUnitSlug?: string;
  businessUnitName?: string;
  userName?: string | null;
  userEmail?: string;
  userAvatarUrl?: string | null;
  userAvatarPreset?: string | null;
  businessUnits?: BusinessUnitNav[];
  canManageUsers?: boolean;
  canCreateBusinessUnit?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

function isNavHrefActive(pathname: string, href: string, exact?: boolean) {
  if (exact || href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Unidad de negocio y ítems hoja activos */
const navUnitActiveClass =
  "font-medium data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary [&_svg]:text-sidebar-foreground";

/** Sección colapsable con hijo activo (p. ej. Ingresos): solo énfasis en texto */
const navSectionActiveClass =
  "data-[active=true]:!bg-transparent data-[active=true]:font-semibold data-[active=true]:!text-foreground hover:data-[active=true]:bg-sidebar-accent data-[active=true]:[&_svg]:text-sidebar-foreground";

/** Subítems hoja activos: subrayado en el texto, sin fondo */
const navLeafActiveClass =
  "data-[active=true]:!bg-transparent data-[active=true]:font-medium data-[active=true]:!text-foreground hover:data-[active=true]:bg-sidebar-accent data-[active=true]:[&>span]:underline data-[active=true]:[&>span]:underline-offset-[3px] data-[active=true]:[&>span]:decoration-sidebar-primary data-[active=true]:[&>span]:decoration-2";

function getUnitNavItems(slug: string) {
  return {
    stats: {
      href: `/${slug}`,
      label: "Estadísticas",
      icon: LayoutDashboard,
      exact: true,
    } satisfies NavItem,
    income: [
      {
        href: `/${slug}/ingresos`,
        label: "Registro de ingresos",
        icon: TrendingUp,
      },
      {
        href: `/${slug}/configuracion/categorias-ingresos`,
        label: "Categorías de ingresos",
        icon: CircleDollarSign,
      },
      {
        href: `/${slug}/configuracion/productos`,
        label: "Catálogo de productos",
        icon: Package,
      },
    ] satisfies NavItem[],
    costs: [
      {
        href: `/${slug}/costos`,
        label: "Registro de costos",
        icon: TrendingDown,
      },
      {
        href: `/${slug}/configuracion/categorias-costos`,
        label: "Categorías de costos",
        icon: Receipt,
      },
    ] satisfies NavItem[],
    settings: {
      href: `/${slug}/configuracion/unidad`,
      label: "Unidad de negocio",
      icon: Building2,
    } satisfies NavItem,
  };
}

function NavCollapsibleSection({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const isSectionActive = items.some((item) =>
    isNavHrefActive(pathname, item.href, item.exact)
  );

  return (
    <Collapsible defaultOpen={isSectionActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            isActive={isSectionActive}
            className={cn(isSectionActive && navSectionActiveClass)}
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
              const active = isNavHrefActive(pathname, item.href, item.exact);

              return (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={active}
                    className={cn(active && navLeafActiveClass)}
                  >
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

function NavNestedCollapsible({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const isSectionActive = items.some((item) =>
    isNavHrefActive(pathname, item.href, item.exact)
  );

  return (
    <Collapsible defaultOpen={isSectionActive} className="group/nested">
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            isActive={isSectionActive}
            className={cn(isSectionActive && navSectionActiveClass)}
          >
            <Icon />
            <span>{label}</span>
            <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/nested:rotate-90" />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 ml-3.5 border-l border-sidebar-border pl-2">
            {items.map((item) => {
              const ItemIcon = item.icon;
              const active = isNavHrefActive(pathname, item.href, item.exact);

              return (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={active}
                    size="sm"
                    className={cn(active && navLeafActiveClass)}
                  >
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
      </SidebarMenuSubItem>
    </Collapsible>
  );
}

function BusinessUnitNavCollapsible({
  unit,
  forceOpen,
}: {
  unit: BusinessUnitNav;
  forceOpen?: boolean;
}) {
  const pathname = usePathname();
  const viewerOnly = unit.role != null && isViewerRole(unit.role);
  const nav = getUnitNavItems(unit.slug);
  const StatsIcon = nav.stats.icon;
  const SettingsIcon = nav.settings.icon;
  const base = `/${unit.slug}`;
  const isUnitActive = pathname === base || pathname.startsWith(`${base}/`);
  const allItems: NavItem[] = viewerOnly
    ? [nav.stats]
    : [nav.stats, ...nav.income, ...nav.costs, nav.settings];
  const isSectionActive = allItems.some((item) =>
    isNavHrefActive(pathname, item.href, item.exact)
  );

  const UnitIcon = () => <BusinessUnitIcon name={unit.icon} className="size-4" />;

  return (
    <Collapsible
      defaultOpen={forceOpen ?? isUnitActive}
      className="group/unit"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={unit.name}
            isActive={isSectionActive}
            className={cn(isSectionActive && navUnitActiveClass)}
          >
            <UnitIcon />
            <span>{unit.name}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/unit:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0">
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                asChild
                isActive={isNavHrefActive(pathname, nav.stats.href, nav.stats.exact)}
                className={cn(
                  isNavHrefActive(pathname, nav.stats.href, nav.stats.exact) &&
                    navLeafActiveClass
                )}
              >
                <Link href={nav.stats.href}>
                  <StatsIcon />
                  <span>{nav.stats.label}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>

            {!viewerOnly && (
              <>
                <NavNestedCollapsible
                  label="Ingresos"
                  icon={TrendingUp}
                  items={nav.income}
                />
                <NavNestedCollapsible
                  label="Costos"
                  icon={TrendingDown}
                  items={nav.costs}
                />

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isNavHrefActive(pathname, nav.settings.href)}
                    className={cn(
                      isNavHrefActive(pathname, nav.settings.href) && navLeafActiveClass
                    )}
                  >
                    <Link href={nav.settings.href}>
                      <SettingsIcon />
                      <span>{nav.settings.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </>
            )}
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
  userAvatarUrl,
  userAvatarPreset,
  businessUnits = [],
  canManageUsers = false,
  canCreateBusinessUnit = false,
  ...props
}: AppSidebarProps) {
  const user = {
    name: userName ?? "Usuario",
    email: userEmail ?? "",
    avatarUrl: userAvatarUrl,
    avatarPreset: userAvatarPreset,
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
              <Link href={mode === "org" ? "/" : `/${businessUnitSlug}`}>
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
              <NavCollapsibleSection
                label="Panel principal"
                icon={LayoutGrid}
                items={[
                  { href: "/", label: "Resumen", icon: LayoutGrid, exact: true },
                  ...(canCreateBusinessUnit
                    ? [
                        {
                          href: "/unidades/nueva",
                          label: "Nueva unidad",
                          icon: Plus,
                        } satisfies NavItem,
                      ]
                    : []),
                  ...(canManageUsers
                    ? [
                        {
                          href: "/usuarios",
                          label: "Usuarios",
                          icon: Users,
                        } satisfies NavItem,
                      ]
                    : []),
                ]}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {businessUnits.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Unidades de negocio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessUnits.map((unit) => (
                  <BusinessUnitNavCollapsible
                    key={unit.id}
                    unit={unit}
                    forceOpen={mode === "business" && unit.slug === businessUnitSlug}
                  />
                ))}
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
