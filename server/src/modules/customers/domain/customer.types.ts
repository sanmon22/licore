import { z } from "zod";

export const createDeliveryPlaceSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  phone: z.string().optional(),
});

export type CreateDeliveryPlaceInput = z.infer<typeof createDeliveryPlaceSchema>;

// Alias for backward compatibility
export const createBranchSchema = createDeliveryPlaceSchema;
export type CreateBranchInput = CreateDeliveryPlaceInput;
