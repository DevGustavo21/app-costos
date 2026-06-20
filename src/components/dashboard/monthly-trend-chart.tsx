"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatUsd } from "@/lib/currency";

type TrendData = {
  month: string;
  monthKey: string;
  ingresos: number;
  costos: number;
};

const chartConfig = {
  ingresos: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
  costos: {
    label: "Costos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function MonthlyTrendChart({ data }: { data: TrendData[] }) {
  const hasData = data.some((d) => d.ingresos > 0 || d.costos > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendencia mensual</CardTitle>
        <CardDescription>Ingresos y costos de los últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin movimientos en los últimos meses
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatUsd(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="ingresos"
                fill="var(--color-ingresos)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="costos"
                fill="var(--color-costos)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
