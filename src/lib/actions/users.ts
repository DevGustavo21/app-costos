"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getUserBusinessUnits } from "@/lib/business-unit";
import { db, newId } from "@/lib/db/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageOrgUsers } from "@/lib/permissions";
import {
  createOrgUserSchema,
  updateOrgUserSchema,
} from "@/lib/validations/user";
import { Role } from "@/types/database";
import type { BusinessUnit } from "@/types/database";

async function requireOrgUsersManagement() {
  const { user } = await requireAuth();
  const memberships = await getUserBusinessUnits(user.id);
  const manageable = memberships.filter((m) => canManageOrgUsers(m.role));

  if (manageable.length === 0) {
    redirect("/");
  }

  const manageableUnitIds = manageable.map((m) => m.businessUnitId);
  const manageableUnits = manageable
    .map((m) => m.businessUnit)
    .filter((u): u is BusinessUnit => u != null);

  return { user, manageableUnitIds, manageableUnits };
}

function assertManageableUnits(
  unitIds: string[],
  manageableUnitIds: string[]
) {
  const invalid = unitIds.filter((id) => !manageableUnitIds.includes(id));
  if (invalid.length > 0) {
    throw new Error("No tiene permiso para asignar una o más unidades seleccionadas");
  }
}

export async function createOrgUser(input: unknown) {
  const { manageableUnitIds } = await requireOrgUsersManagement();
  const data = createOrgUserSchema.parse(input);
  assertManageableUnits(data.businessUnitIds, manageableUnitIds);

  const admin = createAdminClient();

  const { data: existingProfile } = await db()
    .from("users")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();

  if (existingProfile) {
    throw new Error("Ya existe un usuario con este correo");
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { name: data.name },
  });

  if (authError || !created.user) {
    throw new Error(authError?.message ?? "No se pudo crear el usuario");
  }

  const userId = created.user.id;

  const { error: profileError } = await db().from("users").upsert({
    id: userId,
    email: data.email,
    name: data.name,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  const membershipRows = data.businessUnitIds.map((businessUnitId) => ({
    id: newId(),
    user_id: userId,
    business_unit_id: businessUnitId,
    role: data.role,
  }));

  const { error: membershipError } = await db()
    .from("memberships")
    .insert(membershipRows);

  if (membershipError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(membershipError.message);
  }

  revalidatePath("/usuarios");
  revalidatePath("/");
  return { id: userId };
}

export async function updateOrgUser(userId: string, input: unknown) {
  const { user, manageableUnitIds } = await requireOrgUsersManagement();
  const data = updateOrgUserSchema.parse(input);
  assertManageableUnits(data.businessUnitIds, manageableUnitIds);

  if (userId === user.id) {
    throw new Error("No puede modificar su propio acceso desde esta pantalla");
  }

  const { data: targetUser, error: userError } = await db()
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !targetUser) {
    throw new Error("Usuario no encontrado");
  }

  const admin = createAdminClient();

  const { error: profileError } = await db()
    .from("users")
    .update({ name: data.name })
    .eq("id", userId);

  if (profileError) throw new Error(profileError.message);

  if (data.password && data.password.length >= 6) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(
      userId,
      { password: data.password }
    );
    if (passwordError) throw new Error(passwordError.message);
  }

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { name: data.name },
  });

  const { error: deleteError } = await db()
    .from("memberships")
    .delete()
    .eq("user_id", userId)
    .in("business_unit_id", manageableUnitIds);

  if (deleteError) throw new Error(deleteError.message);

  const membershipRows = data.businessUnitIds.map((businessUnitId) => ({
    id: newId(),
    user_id: userId,
    business_unit_id: businessUnitId,
    role: data.role,
  }));

  const { error: insertError } = await db()
    .from("memberships")
    .insert(membershipRows);

  if (insertError) throw new Error(insertError.message);

  revalidatePath("/usuarios");
  revalidatePath("/");
  return { id: userId };
}

export async function removeOrgUser(userId: string) {
  const { user, manageableUnitIds } = await requireOrgUsersManagement();

  if (userId === user.id) {
    throw new Error("No puede eliminar su propia cuenta");
  }

  const { error: deleteError } = await db()
    .from("memberships")
    .delete()
    .eq("user_id", userId)
    .in("business_unit_id", manageableUnitIds);

  if (deleteError) throw new Error(deleteError.message);

  const { count, error: countError } = await db()
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw new Error(countError.message);

  if ((count ?? 0) === 0) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(userId);
    await db().from("users").delete().eq("id", userId);
  }

  revalidatePath("/usuarios");
  revalidatePath("/");
}

export async function getOrgUsersContext() {
  const { user, manageableUnitIds, manageableUnits } =
    await requireOrgUsersManagement();
  return { user, manageableUnitIds, manageableUnits };
}
