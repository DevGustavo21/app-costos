/** Colores para gráficos (SVG no admite hsl(var) con tokens oklch). */
export const CHART_COLORS = [
  "#059669",
  "#10b981",
  "#34d399",
  "#047857",
  "#065f46",
  "#6ee7b7",
  "#14b8a6",
  "#0d9488",
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}
