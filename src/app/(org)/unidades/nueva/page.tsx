import { redirect } from "next/navigation";
import { requireAuth, getUserBusinessUnits } from "@/lib/business-unit";
import { canCreateBusinessUnit } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { CreateBusinessUnitForm } from "@/components/dashboard/create-business-unit-form";

export default async function NuevaUnidadPage() {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);

  if (!canCreateBusinessUnit(memberships)) {
    redirect("/");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 md:gap-8">
      <PageHeader
        title="Nueva unidad de negocio"
        description="Cree una unidad para gestionar ingresos, costos y configuración de forma independiente."
      />
      <CreateBusinessUnitForm />
    </div>
  );
}
