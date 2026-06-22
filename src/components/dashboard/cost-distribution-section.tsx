"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

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

const barChartConfig = {
  desktop: {
    label: "Gasto",
    color: "var(--chart-2)",
  },
  mobile: {
    label: "Gasto",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig;

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

  const barData = React.useMemo(
    () =>
      [...data]
        .sort((a, b) => b.value - a.value)
        .map((item) => ({
          month: item.name,
          desktop: item.value,
          percentage: item.percentage,
        })),
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
        <CardContent className="px-2 pt-4 sm:px-6">
          <ChartContainer config={barChartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={barData}
              layout="vertical"
              margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="month"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                hide
              />
              <XAxis
                dataKey="desktop"
                type="number"
                hide
                domain={[0, (dataMax: number) => (dataMax <= 0 ? 1 : dataMax * 1.22)]}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
                <LabelList
                  dataKey="month"
                  position="insideLeft"
                  offset={8}
                  className="fill-(--color-label)"
                  fontSize={12}
                  fontWeight={700}
                />
                <LabelList
                  dataKey="percentage"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  fontWeight={700}
                  formatter={(value) =>
                    `${Number(value ?? 0).toFixed(1)}%`
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
