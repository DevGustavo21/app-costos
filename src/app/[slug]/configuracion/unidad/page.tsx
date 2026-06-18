import { Role } from "@/types/database";
import { requireBusinessUnitAccess } from "@/lib/business-unit";
import { BusinessUnitSettingsForm } from "@/components/config/business-unit-settings-form";
import { PageHeader } from "@/components/layout/page-header";

export default async function UnidadNegocioPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const { businessUnit } = await requireBusinessUnitAccess(slug, Role.ADMIN);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidad de negocio"
        description="Configure los datos generales de esta unidad de negocio"
      />
      <BusinessUnitSettingsForm businessUnit={businessUnit} />
    </div>
  );
}
