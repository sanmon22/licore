import { z } from "zod";

export const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  casesQuantity: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  branchId: z.number().int().positive(),
  contactName: z.string().min(2),
  contactPhone: z.string().min(5),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "CREDIT"]).default("CASH_ON_DELIVERY"),
  notes: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1),
});

export const calculateCartSchema = z.object({
  items: z.array(orderItemInputSchema).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CalculateCartInput = z.infer<typeof calculateCartSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
