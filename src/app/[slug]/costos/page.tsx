import { redirect } from "next/navigation";
import { CategoryType } from "@/types/database";
import { requireBusinessUnitAccess, businessUnitSlug } from "@/lib/business-unit";
import { getCategories } from "@/lib/actions/categories";
import { getCostsGroupedByMonth, getCurrentMonthKey } from "@/lib/queries/costs";
import { getExchangeRate } from "@/lib/currency";
import { canWriteEntries, isViewerRole } from "@/lib/permissions";
import { CostosClient } from "./costos-client";

export default async function CostosPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
  };
}) {
  const { slug } = params;
  const sp = searchParams;
  const { membership, businessUnit } = await requireBusinessUnitAccess(slug);

  if (isViewerRole(membership.role)) {
    redirect(`/${businessUnitSlug(businessUnit)}`);
  }

  const businessUnitId = businessUnit.id;

  const [categories, months, defaultExchangeRate] = await Promise.all([
    getCategories(businessUnitId, CategoryType.COST),
    getCostsGroupedByMonth(businessUnitId, {
      dateFrom: sp.dateFrom ? new Date(sp.dateFrom) : undefined,
      dateTo: sp.dateTo ? new Date(sp.dateTo) : undefined,
      categoryId: sp.categoryId,
    }),
    getExchangeRate(businessUnitId),
  ]);

  return (
    <CostosClient
      businessUnitId={businessUnitId}
      categories={categories}
      months={months}
      defaultMonthKey={getCurrentMonthKey()}
      defaultExchangeRate={defaultExchangeRate}
      canWrite={canWriteEntries(membership.role)}
    />
  );
}
