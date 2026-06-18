import { CategoryType, Role } from "@/types/database";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { getCategories } from "@/lib/actions/categories";
import { CategoryCrud } from "@/components/config/category-crud";
import { PageHeader } from "@/components/layout/page-header";

export default async function CategoriasCostosPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit } = await requireBusinessUnitAccess(slug, Role.ADMIN);
  const businessUnitId = businessUnit.id;
  const categories = await getCategories(businessUnitId, CategoryType.COST);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías de costos"
        description="Gestione las categorías disponibles en el módulo de costos"
      />
      <CategoryCrud
        businessUnitId={businessUnitId}
        type={CategoryType.COST}
        categories={categories}
        title="Categorías de costos"
      />
    </div>
  );
}
