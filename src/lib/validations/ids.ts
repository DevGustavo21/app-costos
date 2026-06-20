import { z } from "zod";

/** IDs de entidad (UUID o slug). */
export const entityIdSchema = z.string().min(1, "ID requerido");

export const optionalEntityIdSchema = entityIdSchema.optional();
