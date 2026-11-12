import { User, Product, Branch, Order, CustomerType } from "../types";

const API_BASE = "http://localhost:4000/api/v1";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const activeToken = token || localStorage.getItem("licores_token");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (payload: any) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: () => request<any>("/auth/me"),

  // Catalog
  getProducts: (customerType?: CustomerType) => {
    const query = customerType ? `?customerType=${customerType}` : "";
    return request<Product[]>(`/catalog${query}`);
  },

  getProduct: (id: number, customerType?: CustomerType) => {
    const query = customerType ? `?customerType=${customerType}` : "";
    return request<Product>(`/catalog/${id}${query}`);
  },

  updateStock: (id: number, stockCases: number) =>
    request<Product>(`/catalog/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stockCases }),
    }),

  // Customer Branches
  getMyBranches: () => request<Branch[]>("/customers/branches"),

  addBranch: (branch: { name: string; address: string; city: string; phone?: string }) =>
    request<Branch>("/customers/branches", {
      method: "POST",
      body: JSON.stringify(branch),
    }),

  // Orders
  calculateCart: (payload: { customerType?: CustomerType; items: Array<{ productId: number; casesQuantity: number }> }) =>
    request<{ items: any[]; grandTotal: number }>("/orders/calculate-cart", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  checkout: (payload: {
    branchId: number;
    contactName: string;
    contactPhone: string;
    paymentMethod: string;
    notes?: string;
    items: Array<{ productId: number; casesQuantity: number }>;
  }) =>
    request<Order>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request<Order[]>("/orders/my-orders"),

  getAllOrders: () => request<Order[]>("/orders"),

  updateOrderStatus: (id: number, status: string) =>
    request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
