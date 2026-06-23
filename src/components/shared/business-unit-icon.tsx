"use client";

import { Icon } from "@iconify/react";
import { resolveIconId } from "@/lib/business-unit-icons";
import { cn } from "@/lib/utils";

type BusinessUnitIconProps = {
  name?: string | null;
  className?: string;
};

export function BusinessUnitIcon({ name, className }: BusinessUnitIconProps) {
  return (
    <Icon
      icon={resolveIconId(name)}
      className={cn("shrink-0", className)}
      width="1em"
      height="1em"
    />
  );
}
