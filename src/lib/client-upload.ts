"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET = "receipts";
const MAX_SIZE = 5 * 1024 * 1024;

const RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type UploadPurpose = "receipt" | "avatar";

export async function uploadFileToStorage(
  file: File,
  purpose: UploadPurpose = "receipt"
): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("El archivo excede el límite de 5MB");
  }

  const allowed = purpose === "avatar" ? AVATAR_TYPES : RECEIPT_TYPES;
  if (!allowed.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Sesión expirada. Vuelva a iniciar sesión.");
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path =
    purpose === "avatar"
      ? `${user.id}/avatars/${Date.now()}-${sanitizedName}`
      : `${user.id}/${Date.now()}-${sanitizedName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
