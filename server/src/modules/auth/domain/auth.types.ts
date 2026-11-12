import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  businessName: z.string().min(2),
  taxId: z.string().min(5),
  customerType: z.enum(["RETAIL", "INDUSTRIAL"]).default("RETAIL"),
  phone: z.string().optional(),
  branchName: z.string().default("Sede Principal"),
  branchAddress: z.string().min(5),
  branchCity: z.string().min(2),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
