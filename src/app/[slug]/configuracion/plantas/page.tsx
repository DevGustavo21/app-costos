import { Role } from "@/types/database";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { getPlants } from "@/lib/actions/plants";
import { PlantCrud } from "@/components/config/plant-crud";
import { PageHeader } from "@/components/layout/page-header";

export default async function PlantasPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit } = await requireBusinessUnitAccess(slug, Role.ADMIN);
  const businessUnitId = businessUnit.id;
  const plants = await getPlants(businessUnitId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de plantas"
        description="Productos de venta usados en ingresos de plantas"
      />
      <PlantCrud
        businessUnitId={businessUnitId}
        plants={plants}
        measurementUnit={businessUnit.measurementUnit}
      />
    </div>
  );
}
