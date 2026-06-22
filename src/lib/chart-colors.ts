/** Colores para gráficos — paleta azul (variantes shadcn). */
export const CHART_COLORS = [
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#93c5fd",
  "#2b6cb0",
  "#172554",
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}
