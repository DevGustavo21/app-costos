"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/currency";
import { chartColor } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

export { CHART_COLORS, chartColor } from "@/lib/chart-colors";

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
  height = 220,
  innerRadius = 48,
  outerRadius = 72,
  activeIndex: controlledActiveIndex,
  onSliceClick,
  className,
}: PieChartCardProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(null);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;
  const chartData = useMemo(() => withPercentages(data), [data]);

  if (chartData.length === 0 || chartData.every((d) => d.value <= 0)) {
    return (
      <Card className={cn(className)}>
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
    <Card className={cn(className)}>
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
                  fill={chartColor(index)}
                  stroke="#fff"
                  strokeWidth={2}
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
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-3 flex flex-wrap gap-2">
          {chartData.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                activeIndex === i
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
              onClick={() => handleSlice(i)}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: chartColor(i) }}
              />
              {item.name}
              <span className="font-bold">
                ({item.percentage?.toFixed(1) ?? 0}%)
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
