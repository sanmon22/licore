import { create } from "zustand";
import { Product, CustomerType, PriceTier } from "../types";

export interface CartLine {
  productId: number;
  product: Product;
  casesQuantity: number;
  effectiveUnitPrice: number;
  subtotal: number;
  appliedTierMinCases: number;
}

interface CartState {
  items: CartLine[];
  addItem: (product: Product, casesToAdd: number, customerType?: CustomerType) => void;
  updateQuantity: (productId: number, newCases: number, customerType?: CustomerType) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  recalculateAll: (customerType?: CustomerType) => void;
  getTotalCases: () => number;
  getGrandTotal: () => number;
}

function resolvePrice(product: Product, customerType: CustomerType, cases: number): { unitPrice: number; minCases: number } {
  const tiers = (product.priceTiers || product.allTiers || []).filter(
    (t: PriceTier) => t.customerType === customerType
  );

  if (tiers.length === 0) {
    return { unitPrice: product.basePrice || 0, minCases: 1 };
  }

  const eligible = tiers
    .filter((t) => cases >= t.minCases)
    .sort((a, b) => b.minCases - a.minCases);

  if (eligible.length > 0) {
    return { unitPrice: eligible[0].unitPrice, minCases: eligible[0].minCases };
  }

  const base = tiers.sort((a, b) => a.minCases - b.minCases)[0];
  return { unitPrice: base.unitPrice, minCases: base.minCases };
}

const STORAGE_KEY = "licores_cart_items";

function loadSavedItems(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: CartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadSavedItems(),

  addItem: (product, casesToAdd = 1, customerType = "RETAIL") => {
    const current = get().items;
    const existingIndex = current.findIndex((i) => i.productId === product.id);

    let updated: CartLine[];
    if (existingIndex > -1) {
      const existing = current[existingIndex];
      const newCases = existing.casesQuantity + casesToAdd;
      const { unitPrice, minCases } = resolvePrice(product, customerType, newCases);

      updated = [...current];
      updated[existingIndex] = {
        ...existing,
        product,
        casesQuantity: newCases,
        effectiveUnitPrice: unitPrice,
        appliedTierMinCases: minCases,
        subtotal: Number((unitPrice * newCases).toFixed(2)),
      };
    } else {
      const { unitPrice, minCases } = resolvePrice(product, customerType, casesToAdd);
      updated = [
        ...current,
        {
          productId: product.id,
          product,
          casesQuantity: casesToAdd,
          effectiveUnitPrice: unitPrice,
          appliedTierMinCases: minCases,
          subtotal: Number((unitPrice * casesToAdd).toFixed(2)),
        },
      ];
    }

    saveItems(updated);
    set({ items: updated });
  },

  updateQuantity: (productId, newCases, customerType = "RETAIL") => {
    if (newCases <= 0) {
      get().removeItem(productId);
      return;
    }

    const current = get().items;
    const updated = current.map((item) => {
      if (item.productId === productId) {
        const { unitPrice, minCases } = resolvePrice(item.product, customerType, newCases);
        return {
          ...item,
          casesQuantity: newCases,
          effectiveUnitPrice: unitPrice,
          appliedTierMinCases: minCases,
          subtotal: Number((unitPrice * newCases).toFixed(2)),
        };
      }
      return item;
    });

    saveItems(updated);
    set({ items: updated });
  },

  removeItem: (productId) => {
    const updated = get().items.filter((i) => i.productId !== productId);
    saveItems(updated);
    set({ items: updated });
  },

  clearCart: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ items: [] });
  },

  recalculateAll: (customerType = "RETAIL") => {
    const current = get().items;
    const updated = current.map((item) => {
      const { unitPrice, minCases } = resolvePrice(item.product, customerType, item.casesQuantity);
      return {
        ...item,
        effectiveUnitPrice: unitPrice,
        appliedTierMinCases: minCases,
        subtotal: Number((unitPrice * item.casesQuantity).toFixed(2)),
      };
    });
    saveItems(updated);
    set({ items: updated });
  },

  getTotalCases: () => {
    return get().items.reduce((acc, curr) => acc + curr.casesQuantity, 0);
  },

  getGrandTotal: () => {
    const total = get().items.reduce((acc, curr) => acc + curr.subtotal, 0);
    return Number(total.toFixed(2));
  },
}));
