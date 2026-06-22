import { getOrgUsersContext } from "@/lib/actions/users";
import {
  getManageableBusinessUnits,
  listOrgUsers,
} from "@/lib/queries/users";
import { OrgUsersCrud } from "@/components/users/org-users-crud";

export default async function UsuariosPage() {
  const { user, manageableUnitIds } = await getOrgUsersContext();
  const [users, businessUnits] = await Promise.all([
    listOrgUsers(manageableUnitIds),
    getManageableBusinessUnits(manageableUnitIds),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Cree cuentas con correo y contraseña, asigne unidades de negocio y el rol
          de Lector o Editor.
        </p>
      </div>

      <OrgUsersCrud
        users={users}
        businessUnits={businessUnits}
        currentUserId={user.id}
      />
    </div>
  );
}
