import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(3),
  category: z.string().min(2),
  stockCases: z.number().int().min(0).default(0),
  bottlesPerCase: z.number().int().min(1).default(12),
  imageUrl: z.string().url().optional(),
  prices: z.array(
    z.object({
      customerType: z.enum(["RETAIL", "INDUSTRIAL"]),
      minCases: z.number().int().min(1),
      unitPrice: z.number().positive(),
    })
  ).min(1),
});

export const updateStockSchema = z.object({
  stockCases: z.number().int().min(0),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
