import { CategoryType, Role } from "@/types/database";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { getCategories } from "@/lib/actions/categories";
import { CategoryCrud } from "@/components/config/category-crud";
import { PageHeader } from "@/components/layout/page-header";

export default async function CategoriasIngresosPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit } = await requireBusinessUnitAccess(slug, Role.ADMIN);
  const businessUnitId = businessUnit.id;
  const categories = await getCategories(businessUnitId, CategoryType.INCOME);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías de ingresos"
        description="Gestione las categorías disponibles en el módulo de ingresos"
      />
      <CategoryCrud
        businessUnitId={businessUnitId}
        type={CategoryType.INCOME}
        categories={categories}
        title="Categorías de ingresos"
        showPlantFlag
      />
    </div>
  );
}
