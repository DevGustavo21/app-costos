import { redirect } from "next/navigation";
import { CategoryType } from "@/types/database";
import { requireBusinessUnitAccess, businessUnitSlug } from "@/lib/business-unit";
import { getCategories } from "@/lib/actions/categories";
import { getPlants } from "@/lib/actions/plants";
import { getIncomeGroupedByMonth } from "@/lib/queries/income";
import { getCurrentMonthKey } from "@/lib/queries/costs";
import { getExchangeRate } from "@/lib/currency";
import { canWriteEntries, isViewerRole } from "@/lib/permissions";
import { dateOnly } from "@/lib/db/helpers";
import { IngresosClient } from "./ingresos-client";

export default async function IngresosPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
    plantId?: string;
    status?: string;
  };
}) {
  const { slug } = params;
  const sp = searchParams;
  const { membership, businessUnit } = await requireBusinessUnitAccess(slug);

  if (isViewerRole(membership.role)) {
    redirect(`/${businessUnitSlug(businessUnit)}`);
  }

  const businessUnitId = businessUnit.id;

  const [categories, plants, months, defaultExchangeRate] = await Promise.all([
    getCategories(businessUnitId, CategoryType.INCOME),
    getPlants(businessUnitId),
    getIncomeGroupedByMonth(businessUnitId, {
      dateFrom: sp.dateFrom ? new Date(sp.dateFrom) : undefined,
      dateTo: sp.dateTo ? new Date(sp.dateTo) : undefined,
      categoryId: sp.categoryId,
      plantId: sp.plantId,
      collectionStatus: sp.status,
    }),
    getExchangeRate(businessUnitId),
  ]);

  return (
    <IngresosClient
      businessUnitId={businessUnitId}
      categories={categories}
      plants={plants}
      months={months}
      defaultMonthKey={getCurrentMonthKey()}
      defaultDate={dateOnly(new Date())}
      defaultExchangeRate={defaultExchangeRate}
      canWrite={canWriteEntries(membership.role)}
    />
  );
}
