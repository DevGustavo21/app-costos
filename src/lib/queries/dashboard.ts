import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachMonthOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { CategoryType } from "@/types/database";
import { db, dateOnly, sumAmountUsd, unwrapJoin } from "@/lib/db/helpers";
import { mapBudgetLine } from "@/lib/db/mappers";

export type DashboardPeriod = {
  start: Date;
  end: Date;
  label: string;
};

export function parsePeriod(year: number, month: number): DashboardPeriod {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return {
    start,
    end,
    label: format(start, "MMMM yyyy", { locale: es }),
  };
}

async function sumEntriesInPeriod(
  table: "cost_entries" | "income_entries",
  businessUnitId: string,
  start: Date,
  end: Date
) {
  const { data, error } = await db()
    .from(table)
    .select("amount_usd")
    .eq("business_unit_id", businessUnitId)
    .gte("date", dateOnly(start))
    .lte("date", dateOnly(end));

  if (error) throw error;
  return sumAmountUsd(data ?? []);
}

export async function getDashboardKpis(
  businessUnitId: string,
  period: DashboardPeriod
) {
  const prevStart = startOfMonth(subMonths(period.start, 1));
  const prevEnd = endOfMonth(prevStart);

  const [totalIncome, totalCosts, prevIncomeTotal, prevCostsTotal] = await Promise.all([
    sumEntriesInPeriod("income_entries", businessUnitId, period.start, period.end),
    sumEntriesInPeriod("cost_entries", businessUnitId, period.start, period.end),
    sumEntriesInPeriod("income_entries", businessUnitId, prevStart, prevEnd),
    sumEntriesInPeriod("cost_entries", businessUnitId, prevStart, prevEnd),
  ]);

  const netResult = totalIncome - totalCosts;
  const prevNet = prevIncomeTotal - prevCostsTotal;
  const variationPct =
    prevNet !== 0 ? ((netResult - prevNet) / Math.abs(prevNet)) * 100 : 0;

  return {
    totalIncome,
    totalCosts,
    netResult,
    variationPct,
    variationAbs: netResult - prevNet,
    prevNet,
  };
}

export async function getMonthlyTrend(businessUnitId: string, monthsCount = 6) {
  const end = endOfMonth(new Date());
  const start = startOfMonth(subMonths(end, monthsCount - 1));
  const months = eachMonthOfInterval({ start, end });

  const [incomeRes, costRes] = await Promise.all([
    db()
      .from("income_entries")
      .select("date, amount_usd")
      .eq("business_unit_id", businessUnitId)
      .gte("date", dateOnly(start))
      .lte("date", dateOnly(end)),
    db()
      .from("cost_entries")
      .select("date, amount_usd")
      .eq("business_unit_id", businessUnitId)
      .gte("date", dateOnly(start))
      .lte("date", dateOnly(end)),
  ]);

  if (incomeRes.error) throw incomeRes.error;
  if (costRes.error) throw costRes.error;

  const incomeMap = new Map<string, number>();
  const costMap = new Map<string, number>();

  for (const row of incomeRes.data ?? []) {
    const key = format(new Date(row.date), "yyyy-MM");
    incomeMap.set(key, (incomeMap.get(key) ?? 0) + Number(row.amount_usd));
  }
  for (const row of costRes.data ?? []) {
    const key = format(new Date(row.date), "yyyy-MM");
    costMap.set(key, (costMap.get(key) ?? 0) + Number(row.amount_usd));
  }

  return months.map((m) => ({
    month: format(m, "MMM yy", { locale: es }),
    monthKey: format(m, "yyyy-MM"),
    ingresos: incomeMap.get(format(m, "yyyy-MM")) ?? 0,
    costos: costMap.get(format(m, "yyyy-MM")) ?? 0,
  }));
}

export async function getCostDistribution(
  businessUnitId: string,
  period: DashboardPeriod
) {
  const { data, error } = await db()
    .from("cost_entries")
    .select("amount_usd, category_id, categories(id, name)")
    .eq("business_unit_id", businessUnitId)
    .gte("date", dateOnly(period.start))
    .lte("date", dateOnly(period.end));

  if (error) throw error;

  const byCategory = new Map<string, { name: string; value: number }>();
  for (const row of data ?? []) {
    const cat = unwrapJoin(row.categories as { id: string; name: string } | { id: string; name: string }[] | null);
    if (!cat) continue;
    const prev = byCategory.get(cat.id) ?? { name: cat.name, value: 0 };
    prev.value += Number(row.amount_usd);
    byCategory.set(cat.id, prev);
  }

  const total = Array.from(byCategory.values()).reduce((s, c) => s + c.value, 0);

  return Array.from(byCategory.entries())
    .map(([categoryId, { name, value }]) => ({
      categoryId,
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getIncomeDistribution(
  businessUnitId: string,
  period: DashboardPeriod
) {
  const { data, error } = await db()
    .from("income_entries")
    .select("amount_usd, category_id, categories(id, name, is_plant_category)")
    .eq("business_unit_id", businessUnitId)
    .gte("date", dateOnly(period.start))
    .lte("date", dateOnly(period.end));

  if (error) throw error;

  const byCategory = new Map<
    string,
    { name: string; isPlantCategory: boolean; value: number }
  >();

  for (const row of data ?? []) {
    const cat = unwrapJoin(
      row.categories as
        | { id: string; name: string; is_plant_category: boolean }
        | { id: string; name: string; is_plant_category: boolean }[]
        | null
    );
    if (!cat) continue;
    const prev = byCategory.get(cat.id) ?? {
      name: cat.name,
      isPlantCategory: cat.is_plant_category,
      value: 0,
    };
    prev.value += Number(row.amount_usd);
    byCategory.set(cat.id, prev);
  }

  const total = Array.from(byCategory.values()).reduce((s, c) => s + c.value, 0);

  return Array.from(byCategory.entries())
    .map(([categoryId, { name, isPlantCategory, value }]) => ({
      categoryId,
      name,
      isPlantCategory,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getCostCategoryDetails(
  businessUnitId: string,
  categoryId: string,
  period: DashboardPeriod
) {
  const { data, error } = await db()
    .from("cost_entries")
    .select("id, date, description, amount_usd, amount, currency")
    .eq("business_unit_id", businessUnitId)
    .eq("category_id", categoryId)
    .gte("date", dateOnly(period.start))
    .lte("date", dateOnly(period.end))
    .order("date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    description: r.description,
    amountUsd: { toString: () => String(r.amount_usd) },
    amount: { toString: () => String(r.amount) },
    currency: r.currency,
  }));
}

export async function getIncomeCategoryDetails(
  businessUnitId: string,
  categoryId: string,
  period: DashboardPeriod,
  isPlantCategory: boolean
) {
  if (isPlantCategory) {
    const { data: entries, error: e1 } = await db()
      .from("income_entries")
      .select("id")
      .eq("business_unit_id", businessUnitId)
      .eq("category_id", categoryId)
      .gte("date", dateOnly(period.start))
      .lte("date", dateOnly(period.end));

    if (e1) throw e1;
    const entryIds = (entries ?? []).map((e) => e.id);
    if (entryIds.length === 0) {
      return { type: "plants" as const, items: [] };
    }

    const { data: lines, error: e2 } = await db()
      .from("income_lines")
      .select("quantity, subtotal, plant_id, plants(id, name)")
      .in("income_entry_id", entryIds)
      .not("plant_id", "is", null);

    if (e2) throw e2;

    const ranking = new Map<string, { name: string; units: number; total: number }>();
    for (const line of lines ?? []) {
      const plant = unwrapJoin(line.plants as { id: string; name: string } | { id: string; name: string }[] | null);
      if (!plant) continue;
      const prev = ranking.get(plant.id) ?? { name: plant.name, units: 0, total: 0 };
      prev.units += line.quantity;
      prev.total += Number(line.subtotal);
      ranking.set(plant.id, prev);
    }

    return {
      type: "plants" as const,
      items: Array.from(ranking.entries())
        .map(([plantId, v]) => ({ plantId, ...v }))
        .sort((a, b) => b.units - a.units),
    };
  }

  const { data, error } = await db()
    .from("income_entries")
    .select("id, date, description, amount_usd, amount, currency")
    .eq("business_unit_id", businessUnitId)
    .eq("category_id", categoryId)
    .gte("date", dateOnly(period.start))
    .lte("date", dateOnly(period.end))
    .order("date", { ascending: false });

  if (error) throw error;

  return {
    type: "entries" as const,
    items: (data ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      amountUsd: { toString: () => String(r.amount_usd) },
      amount: { toString: () => String(r.amount) },
      currency: r.currency,
    })),
  };
}

export async function getBudgetExecution(
  businessUnitId: string,
  period: DashboardPeriod
) {
  const { data: budgets, error } = await db()
    .from("budgets")
    .select("id")
    .eq("business_unit_id", businessUnitId)
    .lte("period_start", dateOnly(period.end))
    .gte("period_end", dateOnly(period.start))
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!budgets?.length) return [];

  const { data: lines, error: e2 } = await db()
    .from("budget_lines")
    .select("*, categories(*)")
    .eq("budget_id", budgets[0]!.id);

  if (e2) throw e2;

  const budgetLines = (lines ?? []).map(mapBudgetLine);

  const results = await Promise.all(
    budgetLines.map(async (line) => {
      const table = line.type === CategoryType.COST ? "cost_entries" : "income_entries";
      const { data: rows } = await db()
        .from(table)
        .select("amount_usd")
        .eq("business_unit_id", businessUnitId)
        .eq("category_id", line.categoryId)
        .gte("date", dateOnly(period.start))
        .lte("date", dateOnly(period.end));

      const actual = sumAmountUsd(rows ?? []);
      const planned = line.plannedAmountUsd;

      return {
        categoryId: line.categoryId,
        categoryName: line.category?.name ?? "",
        type: line.type,
        planned,
        actual,
        executionPct: planned > 0 ? (actual / planned) * 100 : 0,
      };
    })
  );

  return results;
}
