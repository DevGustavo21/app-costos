import { z } from "zod";

/** IDs de Supabase (UUID o slug legado), no CUID de Prisma. */
export const entityIdSchema = z.string().min(1, "ID requerido");

export const optionalEntityIdSchema = entityIdSchema.optional();
