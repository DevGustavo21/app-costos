"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/currency";
import { chartColor } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import type { OrganizationDashboardData } from "@/lib/queries/organization-dashboard";

type OrganizationOverviewProps = {
  data: OrganizationDashboardData;
  canCreateBusinessUnit?: boolean;
};

export function OrganizationOverview({
  data,
  canCreateBusinessUnit = false,
}: OrganizationOverviewProps) {
  const { units, pieData, periodLabel } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-base capitalize">
            Ingresos por unidad — {periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sin ingresos registrados este mes. Los datos aparecerán cuando registre movimientos en sus unidades.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColor(index)}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatUsd(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-2">
                {pieData.map((item, i) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: chartColor(i) }}
                    />
                    {item.name} ({item.percentage.toFixed(1)}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unidades de negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {units.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {canCreateBusinessUnit ? (
                <>
                  Aún no tiene unidades.{" "}
                  <Link
                    href="/unidades/nueva"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Cree la primera aquí
                  </Link>
                  .
                </>
              ) : (
                "Aún no tiene unidades asignadas."
              )}
            </p>
          ) : (
            units.map((unit) => (
              <Button
                key={unit.businessUnitId}
                variant="ghost"
                className="h-auto w-full justify-between rounded-lg bg-muted/40 px-4 py-3 hover:bg-muted/70"
                asChild
              >
                <Link href={`/${unit.slug}`}>
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="text-left">
                      <span className="block font-medium">{unit.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        Neto:{" "}
                        <span
                          className={cn(
                            unit.net >= 0 ? "text-emerald-700" : "text-red-600"
                          )}
                        >
                          {formatUsd(unit.net)}
                        </span>
                        {" · "}
                        {formatUsd(unit.income)} ing. / {formatUsd(unit.costs)} cost.
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="hidden sm:inline-flex">
                      {unit.role}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </span>
                </Link>
              </Button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
