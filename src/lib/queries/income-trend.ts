import { subMonths, eachDayOfInterval, format, startOfDay } from "date-fns";
import { db, dateOnly } from "@/lib/db/helpers";

export async function getDailyIncomeTrend(businessUnitId: string, months = 12) {
  const end = new Date();
  const start = startOfDay(subMonths(end, months));

  const { data, error } = await db()
    .from("income_entries")
    .select("date, amount_usd")
    .eq("business_unit_id", businessUnitId)
    .gte("date", dateOnly(start))
    .lte("date", dateOnly(end));

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const key = String(row.date).split("T")[0]!;
    totals.set(key, (totals.get(key) ?? 0) + Number(row.amount_usd));
  }

  return eachDayOfInterval({ start, end }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      ingresos: totals.get(date) ?? 0,
    };
  });
}
