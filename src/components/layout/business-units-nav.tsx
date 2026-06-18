"use client";

import { Building2 } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";

export type BusinessUnitNav = {
  id: string;
  slug: string;
  name: string;
};

type BusinessUnitsNavProps = {
  units: BusinessUnitNav[];
  onNavigate?: () => void;
};

export function BusinessUnitsNav({
  units,
  onNavigate,
}: BusinessUnitsNavProps) {
  if (units.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Unidades de negocio
      </p>
      {units.map((unit) => (
        <NavLink
          key={unit.id}
          href={`/${unit.slug}`}
          onNavigate={onNavigate}
          icon={Building2}
        >
          <span className="truncate">{unit.name}</span>
        </NavLink>
      ))}
    </div>
  );
}
