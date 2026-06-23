import type { ReactNode } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const kpiCardGridClassName =
  "grid grid-cols-1 gap-4 *:data-[slot=card]:border-zinc-200/80 *:data-[slot=card]:bg-zinc-50/90 *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:border-zinc-800 dark:*:data-[slot=card]:bg-zinc-900/40 @xl/main:grid-cols-2 @5xl/main:grid-cols-4";

export const kpiValueClassName = "text-zinc-700 dark:text-zinc-300";
export const kpiMutedClassName = "text-zinc-500 dark:text-zinc-400";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  tags?: ReactNode;
  footer?: ReactNode;
};

export function KpiCardGrid({ children }: { children: ReactNode }) {
  return <div className={kpiCardGridClassName}>{children}</div>;
}

export function KpiCard({ label, value, tags, footer }: KpiCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription className={kpiMutedClassName}>{label}</CardDescription>
        <CardTitle
          className={cn(
            "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
            kpiValueClassName
          )}
        >
          {value}
        </CardTitle>
        {tags}
      </CardHeader>
      {footer ? (
        <CardFooter className={cn("text-sm", kpiMutedClassName)}>{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
