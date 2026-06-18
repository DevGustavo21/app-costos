"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { OrganizationDashboardData } from "@/lib/queries/organization-dashboard";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1",
  "#f59e0b",
];

type OrganizationOverviewProps = {
  data: OrganizationDashboardData;
};

export function OrganizationOverview({ data }: OrganizationOverviewProps) {
  const { units, pieData, periodLabel } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
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
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatUsd(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-2">
                {pieData.map((item, i) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    {item.name} ({item.percentage.toFixed(1)}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Unidades de negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {units.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no tiene unidades. Cree la primera con el formulario.
            </p>
          ) : (
            units.map((unit) => (
              <Button
                key={unit.businessUnitId}
                variant="outline"
                className="h-auto w-full justify-between px-4 py-3"
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
