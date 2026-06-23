import { Role, CategoryType } from "@/types/database";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { getCategories } from "@/lib/actions/categories";
import { getPlants } from "@/lib/actions/plants";
import { ProductCrud } from "@/components/config/product-crud";
import { PageHeader } from "@/components/layout/page-header";

export default async function ProductosPage({
  params,
}: {
  params: { slug: string };
}) {
  const { businessUnit } = await requireBusinessUnitAccess(params.slug, Role.ADMIN);
  const businessUnitId = businessUnit.id;

  const [products, incomeCategories] = await Promise.all([
    getPlants(businessUnitId),
    getCategories(businessUnitId, CategoryType.INCOME),
  ]);

  const parentCategories = incomeCategories.filter(
    (c) => c.isActive && c.isPlantCategory
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de productos"
        description="Subproductos con precio y stock, asignados a una categoría de ingreso (ej. Ganado → novillo, toro, vaca)"
      />
      <ProductCrud
        businessUnitId={businessUnitId}
        products={products}
        catalogCategories={parentCategories}
      />
    </div>
  );
}
