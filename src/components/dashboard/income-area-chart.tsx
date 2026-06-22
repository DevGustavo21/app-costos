"use client";

import * as React from "react";
import { subMonths, startOfDay } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUsd } from "@/lib/currency";

export type DailyIncomePoint = {
  date: string;
  ingresos: number;
};

const chartConfig = {
  ingresos: {
    label: "Ingresos",
  },
  desktop: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type IncomeAreaChartProps = {
  data: DailyIncomePoint[];
};

const TIME_RANGES = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
} as const;

type TimeRange = keyof typeof TIME_RANGES;

export function IncomeAreaChart({ data }: IncomeAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("3m");

  const referenceDate = React.useMemo(() => {
    if (data.length === 0) return new Date();
    return new Date(data[data.length - 1]!.date);
  }, [data]);

  const filteredData = React.useMemo(() => {
    const months = TIME_RANGES[timeRange];
    const startDate = startOfDay(subMonths(referenceDate, months));

    return data
      .filter((item) => new Date(item.date) >= startDate)
      .map((item) => ({
        date: item.date,
        desktop: item.ingresos,
      }));
  }, [data, referenceDate, timeRange]);

  const hasData = filteredData.some((item) => item.desktop > 0);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("es", {
      month: "short",
      day: "numeric",
    });

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-base">Ingresos</CardTitle>
          <CardDescription>
            Evolución diaria de ingresos en el período seleccionado
          </CardDescription>
        </div>
        <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
        >
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Seleccionar período"
          >
            <SelectValue placeholder="Últimos 3 meses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="3m" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="6m" className="rounded-lg">
              Últimos 6 meses
            </SelectItem>
            <SelectItem value="12m" className="rounded-lg">
              Últimos 12 meses
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!hasData ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin ingresos en el período seleccionado
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-desktop)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDate}
                tick={{ fontWeight: 700 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("es", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                    formatter={(value) => formatUsd(Number(value))}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
