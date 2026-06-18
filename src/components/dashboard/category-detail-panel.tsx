"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatUsd } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardPeriod } from "@/lib/queries/dashboard";

type DetailItem =
  | {
      type: "entries";
      items: {
        id: string;
        date: Date;
        description: string | null;
        amountUsd: { toString(): string };
        amount: { toString(): string };
        currency: string;
      }[];
    }
  | {
      type: "plants";
      items: { name: string; units: number; total: number }[];
    };

type CategoryDetailPanelProps = {
  businessUnitId: string;
  categoryId: string | null;
  categoryName: string;
  isPlantCategory: boolean;
  entryType: "cost" | "income";
  period: DashboardPeriod | { start: string | Date; end: string | Date; label: string };
};

export function CategoryDetailPanel({
  businessUnitId,
  categoryId,
  categoryName,
  isPlantCategory,
  entryType,
  period,
}: CategoryDetailPanelProps) {
  const [data, setData] = useState<DetailItem | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!categoryId) {
      setData(null);
      return;
    }

    startTransition(async () => {
      const periodStart = new Date(period.start);
      const params = new URLSearchParams({
        businessUnitId,
        categoryId,
        year: periodStart.getFullYear().toString(),
        month: (periodStart.getMonth() + 1).toString(),
        isPlantCategory: isPlantCategory.toString(),
        entryType,
      });

      const res = await fetch(`/api/dashboard/category-detail?${params}`);
      const json = await res.json();
      setData(json);
    });
  }, [businessUnitId, categoryId, period, isPlantCategory, entryType]);

  if (!categoryId) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Seleccione una categoría en el gráfico
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">{categoryName}</CardTitle>
        <p className="text-xs text-muted-foreground capitalize">{period.label}</p>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : data?.type === "plants" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Ranking de plantas vendidas</p>
            <ul className="space-y-2">
              {data.items.map((item, i) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>
                    <span className="mr-2 font-mono text-muted-foreground">#{i + 1}</span>
                    {item.name}
                  </span>
                  <span className="text-right">
                    <span className="block">{item.units} uds.</span>
                    <span className="text-muted-foreground">{formatUsd(item.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : data?.type === "entries" ? (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between rounded-md border p-2 text-sm"
              >
                <div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(item.date), "dd MMM yyyy", { locale: es })}
                  </p>
                  <p>{item.description ?? "—"}</p>
                </div>
                <span className="font-medium">{formatUsd(item.amountUsd.toString())}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin registros en el período</p>
        )}
      </CardContent>
    </Card>
  );
}
