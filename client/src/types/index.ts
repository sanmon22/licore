export type Role = "CUSTOMER" | "SUPERVISOR" | "ADMIN";
export type CustomerType = "RETAIL" | "INDUSTRIAL";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  customerId?: number;
  customerType?: CustomerType;
}

export interface Customer {
  id: number;
  userId: number;
  businessName: string;
  taxId: string;
  customerType: CustomerType;
  phone?: string;
  createdAt: string;
}

export interface Branch {
  id: number;
  customerId: number;
  name: string;
  address: string;
  city: string;
  phone?: string;
  createdAt: string;
}

export interface PriceTier {
  id: number;
  productId: number;
  customerType: CustomerType;
  minCases: number;
  unitPrice: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  stockCases: number;
  bottlesPerCase: number;
  imageUrl?: string;
  basePrice: number;
  priceTiers: PriceTier[];
  allTiers?: PriceTier[];
}

export interface CartItem {
  productId: number;
  product: Product;
  casesQuantity: number;
  effectiveUnitPrice: number;
  subtotal: number;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "CREDIT";

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string;
  imageUrl?: string;
  casesQuantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  code: string;
  customerId: number;
  branchId: number;
  contactName: string;
  contactPhone: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
  notes?: string;
  createdAt: string;
  branch?: Branch;
  customer?: Customer;
  items: OrderItem[];
}
