"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/currency";
import { cn } from "@/lib/utils";

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

export type PieChartDatum = {
  id: string;
  name: string;
  value: number;
  percentage?: number;
  meta?: Record<string, string | number>;
};

type PieChartCardProps = {
  title: string;
  description?: string;
  data: PieChartDatum[];
  emptyMessage?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  activeIndex?: number | null;
  onSliceClick?: (index: number, item: PieChartDatum) => void;
  className?: string;
};

function withPercentages(data: PieChartDatum[]): PieChartDatum[] {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return data;
  return data.map((item) => ({
    ...item,
    percentage: item.percentage ?? (item.value / total) * 100,
  }));
}

export function PieChartCard({
  title,
  description,
  data,
  emptyMessage = "Sin datos en el período",
  height = 280,
  innerRadius = 55,
  outerRadius = 95,
  showLegend = true,
  activeIndex: controlledActiveIndex,
  onSliceClick,
  className,
}: PieChartCardProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(null);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;
  const chartData = useMemo(() => withPercentages(data), [data]);

  if (chartData.length === 0 || chartData.every((d) => d.value <= 0)) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <p className="py-12 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSlice = (index: number) => {
    if (onSliceClick) {
      onSliceClick(index, chartData[index]!);
    } else {
      setInternalActiveIndex(index);
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              onMouseEnter={(_, index) => !onSliceClick && setInternalActiveIndex(index)}
              onClick={(_, index) => handleSlice(index)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke={activeIndex === index ? "hsl(var(--foreground))" : "none"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  className="cursor-pointer outline-none transition-opacity hover:opacity-90"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, props) => {
                const item = props.payload as PieChartDatum;
                const pct = item.percentage?.toFixed(1) ?? "0";
                return [`${formatUsd(Number(value))} (${pct}%)`, item.name];
              }}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-3 flex flex-wrap gap-2">
          {chartData.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                activeIndex === i
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
              onClick={() => handleSlice(i)}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              {item.name}
              <span className="font-medium">
                ({item.percentage?.toFixed(1) ?? 0}%)
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
