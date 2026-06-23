"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db/helpers";
import { mapUser } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  phone: z.string().max(30).optional().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarPreset: z.string().nullable().optional(),
});

export async function getCurrentUserProfile() {
  const { user } = await requireAuth();
  const { data, error } = await db()
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) throw new Error("Usuario no encontrado");
  return mapUser(data);
}

export async function updateUserProfile(input: unknown) {
  const { user } = await requireAuth();
  const data = profileSchema.parse(input);

  const { error } = await db()
    .from("users")
    .update({
      name: data.name,
      phone: data.phone ?? null,
      avatar_url: data.avatarUrl ?? null,
      avatar_preset: data.avatarPreset ?? null,
    })
    .eq("id", user.id);

  if (error) throw error;

  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { name: data.name },
  });

  revalidatePath("/");
  revalidatePath("/perfil");
  return { success: true };
}
