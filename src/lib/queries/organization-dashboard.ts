import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { db, dateOnly } from "@/lib/db/helpers";
import { getUserBusinessUnits, businessUnitSlug } from "@/lib/business-unit";

export type BusinessUnitOverview = {
  businessUnitId: string;
  slug: string;
  name: string;
  role: string;
  income: number;
  costs: number;
  net: number;
};

export type OrganizationDashboardData = {
  periodLabel: string;
  units: BusinessUnitOverview[];
  pieData: { id: string; name: string; value: number; percentage: number }[];
  totals: {
    income: number;
    costs: number;
    net: number;
    unitCount: number;
  };
};

function aggregateByUnit(
  rows: { business_unit_id: string; amount_usd: number | string }[]
) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const id = row.business_unit_id;
    map.set(id, (map.get(id) ?? 0) + Number(row.amount_usd));
  }
  return map;
}

export async function getOrganizationDashboard(
  userId: string
): Promise<OrganizationDashboardData> {
  const memberships = await getUserBusinessUnits(userId);
  const start = startOfMonth(new Date());
  const end = endOfMonth(start);
  const periodLabel = format(start, "MMMM yyyy", { locale: es });
  const buIds = memberships.map((m) => m.businessUnitId);

  if (buIds.length === 0) {
    return {
      periodLabel,
      units: [],
      pieData: [],
      totals: { income: 0, costs: 0, net: 0, unitCount: 0 },
    };
  }

  const dateFrom = dateOnly(start);
  const dateTo = dateOnly(end);

  const [incomeRes, costRes] = await Promise.all([
    db()
      .from("income_entries")
      .select("business_unit_id, amount_usd")
      .in("business_unit_id", buIds)
      .gte("date", dateFrom)
      .lte("date", dateTo),
    db()
      .from("cost_entries")
      .select("business_unit_id, amount_usd")
      .in("business_unit_id", buIds)
      .gte("date", dateFrom)
      .lte("date", dateTo),
  ]);

  if (incomeRes.error) throw incomeRes.error;
  if (costRes.error) throw costRes.error;

  const incomeByUnit = aggregateByUnit(incomeRes.data ?? []);
  const costByUnit = aggregateByUnit(costRes.data ?? []);

  const units: BusinessUnitOverview[] = memberships.map((m) => {
    const income = incomeByUnit.get(m.businessUnitId) ?? 0;
    const costs = costByUnit.get(m.businessUnitId) ?? 0;
    return {
      businessUnitId: m.businessUnitId,
      slug: m.businessUnit ? businessUnitSlug(m.businessUnit) : m.businessUnitId,
      name: m.businessUnit?.name ?? m.businessUnitId,
      role: m.role,
      income,
      costs,
      net: income - costs,
    };
  });

  const totals = units.reduce(
    (acc, u) => ({
      income: acc.income + u.income,
      costs: acc.costs + u.costs,
      net: acc.net + u.net,
      unitCount: acc.unitCount + 1,
    }),
    { income: 0, costs: 0, net: 0, unitCount: 0 }
  );

  const pieBase = units.filter((u) => u.income > 0);
  const pieTotal = pieBase.reduce((s, u) => s + u.income, 0);

  const pieData = pieBase
    .map((u) => ({
      id: u.businessUnitId,
      name: u.name,
      value: u.income,
      percentage: pieTotal > 0 ? (u.income / pieTotal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return { periodLabel, units, pieData, totals };
}
