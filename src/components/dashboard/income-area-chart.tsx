"use client";

import * as React from "react";
import {
  subMonths,
  startOfDay,
  startOfMonth,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
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
type Granularity = "month" | "day";

export function IncomeAreaChart({ data }: IncomeAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("3m");
  const [granularity, setGranularity] = React.useState<Granularity>("month");

  const referenceDate = React.useMemo(() => {
    if (data.length === 0) return new Date();
    return new Date(data[data.length - 1]!.date);
  }, [data]);

  const filteredDailyData = React.useMemo(() => {
    const months = TIME_RANGES[timeRange];
    const startDate = startOfDay(subMonths(referenceDate, months));

    return data
      .filter((item) => new Date(item.date) >= startDate)
      .map((item) => ({
        date: item.date,
        desktop: item.ingresos,
      }));
  }, [data, referenceDate, timeRange]);

  const monthRange = React.useMemo(() => {
    const months = TIME_RANGES[timeRange];
    return {
      start: startOfMonth(subMonths(referenceDate, months - 1)),
      end: referenceDate,
    };
  }, [referenceDate, timeRange]);

  const chartData = React.useMemo(() => {
    if (granularity === "day") {
      return filteredDailyData;
    }

    const monthTotals = new Map<string, number>();
    for (const item of data) {
      const date = new Date(item.date);
      if (date < monthRange.start || date > monthRange.end) continue;
      const monthKey = format(date, "yyyy-MM");
      monthTotals.set(monthKey, (monthTotals.get(monthKey) ?? 0) + item.ingresos);
    }

    return eachMonthOfInterval({
      start: monthRange.start,
      end: startOfMonth(monthRange.end),
    }).map((month) => {
      const monthKey = format(month, "yyyy-MM");
      return {
        date: format(month, "yyyy-MM-dd"),
        desktop: monthTotals.get(monthKey) ?? 0,
      };
    });
  }, [data, filteredDailyData, granularity, monthRange]);

  const hasData = chartData.some((item) => item.desktop > 0);

  const formatAxisDate = (value: string) => {
    const date = new Date(value);
    if (granularity === "month") {
      return format(date, "MMM yy", { locale: es });
    }
    return date.toLocaleDateString("es", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTooltipDate = (value: string) => {
    const date = new Date(value);
    if (granularity === "month") {
      return format(date, "MMMM yyyy", { locale: es });
    }
    return date.toLocaleDateString("es", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="pt-0">
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0 border-b py-4">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">Ingresos</CardTitle>
          <CardDescription>
            {granularity === "month"
              ? "Evolución mensual de ingresos en el período seleccionado"
              : "Evolución diaria de ingresos en el período seleccionado"}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={granularity}
            onValueChange={(value) => setGranularity(value as Granularity)}
          >
            <SelectTrigger className="w-[7.5rem] rounded-lg" aria-label="Seleccionar vista">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="month" className="rounded-lg">
                Por mes
              </SelectItem>
              <SelectItem value="day" className="rounded-lg">
                Por día
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[10.5rem] rounded-lg" aria-label="Seleccionar período">
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
        </div>
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
            <AreaChart data={chartData}>
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
                tickFormatter={formatAxisDate}
                tick={{ fontWeight: 700 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={formatTooltipDate}
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
