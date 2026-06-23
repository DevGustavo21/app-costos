"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatUsd } from "@/lib/currency";
import type { DashboardPeriod } from "@/lib/queries/dashboard";

const PIE_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

function CategorySpendBar({
  percentage,
  value,
}: {
  percentage: number;
  value: number;
}) {
  const width = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative h-7 min-w-[8rem] flex-1 overflow-hidden rounded border border-primary/15 bg-primary/[0.08]">
        <div
          className="absolute inset-y-0 left-0 bg-primary/35"
          style={{ width: `${width}%` }}
        />
        <span className="absolute inset-y-0 right-2 flex items-center text-xs font-medium tabular-nums text-foreground/85">
          {percentage.toFixed(2)}%
        </span>
      </div>
      <span className="shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
        {formatUsd(value)}
      </span>
    </div>
  );
}

function getSliceKey(index: number) {
  return `item${index}`;
}

type CostDistributionItem = {
  categoryId: string;
  name: string;
  value: number;
  percentage: number;
};

function buildPieChartConfig(data: CostDistributionItem[]): ChartConfig {
  const config: ChartConfig = {
    value: { label: "Gasto" },
  };

  data.forEach((item, index) => {
    config[getSliceKey(index)] = {
      label: item.name,
      color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
    };
  });

  return config;
}

type CostDistributionSectionProps = {
  data: CostDistributionItem[];
  period: DashboardPeriod;
};

export function CostDistributionSection({
  data,
  period,
}: CostDistributionSectionProps) {
  const pieChartConfig = React.useMemo(() => buildPieChartConfig(data), [data]);

  const pieData = React.useMemo(
    () =>
      data.map((item, index) => {
        const key = getSliceKey(index);
        return {
          categoryId: item.categoryId,
          name: item.name,
          value: item.value,
          percentage: item.percentage,
          fill: `var(--color-${key})`,
        };
      }),
    [data]
  );

  const sortedBySpend = React.useMemo(
    () => [...data].sort((a, b) => b.value - a.value),
    [data]
  );

  const hasData = data.length > 0 && data.some((item) => item.value > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución de costos</CardTitle>
          <CardDescription className="capitalize">{period.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin costos en el período
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="flex flex-col pt-0">
        <CardHeader className="items-center border-b py-5 pb-4">
          <CardTitle className="text-base">Distribución de costos</CardTitle>
          <CardDescription className="capitalize">{period.label}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 px-2 pb-4 pt-4 sm:px-6">
          <ChartContainer
            config={pieChartConfig}
            className="mx-auto aspect-square max-h-[250px] w-full"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    formatter={(value, _name, item) => {
                      const pct = Number(item.payload?.percentage ?? 0).toFixed(1);
                      return [`${formatUsd(Number(value))} (${pct}%)`, item.payload?.name];
                    }}
                  />
                }
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={({ payload, ...props }) => (
                  <text
                    cx={props.cx}
                    cy={props.cy}
                    x={props.x}
                    y={props.y}
                    textAnchor={props.textAnchor}
                    dominantBaseline={props.dominantBaseline}
                    fill="var(--foreground)"
                    fontSize={11}
                    fontWeight={700}
                  >
                    {`${Number(payload.percentage).toFixed(0)}%`}
                  </text>
                )}
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="pt-0">
        <CardHeader className="border-b py-5">
          <CardTitle className="text-base">Gasto por categoría</CardTitle>
          <CardDescription>
            Del mayor al menor gasto en el período
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-0 sm:px-6">
          <div className="divide-y divide-border/70">
            {sortedBySpend.map((item) => (
              <div
                key={item.categoryId}
                className="flex items-center gap-4 py-3.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="truncate text-sm text-foreground">
                    {item.name}
                  </span>
                </div>
                <div className="shrink-0 sm:w-[52%] sm:max-w-md">
                  <CategorySpendBar
                    percentage={item.percentage}
                    value={item.value}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
