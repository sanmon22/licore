import { z } from "zod";
import { SystemConfig } from "../../../db/schema.js";

export const updateConfigSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean()]).transform((val) => String(val)),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;

export type { SystemConfig };
