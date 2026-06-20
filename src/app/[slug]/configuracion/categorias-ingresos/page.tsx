import { CategoryType, Role } from "@/types/database";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { getCategories } from "@/lib/actions/categories";
import { getPlants } from "@/lib/actions/plants";
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

  const [categories, products] = await Promise.all([
    getCategories(businessUnitId, CategoryType.INCOME),
    getPlants(businessUnitId).catch(() => []),
  ]);

  const productCounts = products.reduce<Record<string, number>>((acc, product) => {
    if (!product.categoryId) return acc;
    acc[product.categoryId] = (acc[product.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías de ingresos"
        description="Categorías generales (Ganado, Leche). Active catálogo para definir subproductos con precio y stock."
      />
      <CategoryCrud
        businessUnitId={businessUnitId}
        type={CategoryType.INCOME}
        categories={categories}
        title="Categorías de ingresos"
        showPlantFlag
        productCounts={productCounts}
      />
    </div>
  );
}
