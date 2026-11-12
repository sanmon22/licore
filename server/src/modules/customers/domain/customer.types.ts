import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  phone: z.string().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
