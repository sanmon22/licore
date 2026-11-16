import { ProductPrice } from "../../../db/schema.js";

/**
 * Pure domain logic: resolves the active tiered price for a product based on
 * the customer type and ordered quantity of cases.
 */
export function resolveTieredUnitPrice(
  prices: ProductPrice[],
  customerType: "RETAIL" | "INDUSTRIAL",
  casesQuantity: number
): { unitPrice: number; appliedMinCases: number } {
  const matchingTypePrices = prices.filter((p) => p.customerType === customerType);

  if (matchingTypePrices.length === 0) {
    throw new Error(`No prices configured for customer type ${customerType}`);
  }

  // Find the highest minCases tier that the requested quantity satisfies
  const eligibleTiers = matchingTypePrices
    .filter((p) => casesQuantity >= p.minCases)
    .sort((a, b) => b.minCases - a.minCases);

  if (eligibleTiers.length > 0) {
    return {
      unitPrice: eligibleTiers[0].unitPrice,
      appliedMinCases: eligibleTiers[0].minCases,
    };
  }

  // Fallback to base tier (lowest minCases)
  const baseTier = matchingTypePrices.sort((a, b) => a.minCases - b.minCases)[0];
  return {
    unitPrice: baseTier.unitPrice,
    appliedMinCases: baseTier.minCases,
  };
}

/**
 * Validates Minimum Order Quantity (MOQ) based on delivery type.
 * STANDARD requires at least minCasesStandard (default: 3 cases).
 * EXPRESS_EMERGENCY requires at least minCasesExpress (default: 1 case).
 */
export function validateMinimumOrderQuantity(
  totalCases: number,
  deliveryType: "STANDARD" | "EXPRESS_EMERGENCY",
  minCasesStandard = 3,
  minCasesExpress = 1
): void {
  if (deliveryType === "STANDARD" && totalCases < minCasesStandard) {
    throw new Error(
      `Pedido mínimo no alcanzado: El despacho estándar requiere al menos ${minCasesStandard} cajas (solicitadas: ${totalCases}).`
    );
  }

  if (deliveryType === "EXPRESS_EMERGENCY" && totalCases < minCasesExpress) {
    throw new Error(
      `Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos ${minCasesExpress} caja (solicitadas: ${totalCases}).`
    );
  }
}

/**
 * Calculates shipping fee based on delivery type.
 * STANDARD: 0 COP.
 * EXPRESS_EMERGENCY: expressFeeCop (default: 35000 COP).
 */
export function calculateShippingFee(
  deliveryType: "STANDARD" | "EXPRESS_EMERGENCY",
  expressFeeCop = 35000
): number {
  return deliveryType === "EXPRESS_EMERGENCY" ? expressFeeCop : 0;
}

/**
 * Generates human-friendly Crockford Base32 order business code:
 * Pattern: ORD-[YY][MM]-[XXXX], e.g. ORD-2611-7B3K
 */
export function generateOrderCode(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const chars = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${yy}${mm}-${random}`;
}

export type PaymentMethod = "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "CREDIT_CARD" | "CREDIT";

/**
 * Maps payment method to its corresponding SystemConfig boolean parameter key.
 */
export function getPaymentMethodConfigKey(paymentMethod: PaymentMethod): string {
  switch (paymentMethod) {
    case "CASH_ON_DELIVERY":
      return "payment_cod_enabled";
    case "BANK_TRANSFER":
      return "payment_bank_transfer_enabled";
    case "CREDIT_CARD":
    case "CREDIT":
      return "payment_credit_card_enabled";
    default:
      throw new Error(`Método de pago no reconocido: ${paymentMethod}`);
  }
}

/**
 * Validates whether the selected payment method is active in SystemConfig.
 */
export function validatePaymentMethodActive(
  paymentMethod: PaymentMethod,
  isEnabled: boolean
): void {
  if (!isEnabled) {
    const names: Record<PaymentMethod, string> = {
      CASH_ON_DELIVERY: "Contra Entrega (Efectivo/Datáfono)",
      BANK_TRANSFER: "Transferencia Bancaria",
      CREDIT_CARD: "Tarjeta de Crédito / Pasarela",
      CREDIT: "Tarjeta de Crédito / Pasarela",
    };
    throw new Error(
      `El método de pago '${names[paymentMethod] || paymentMethod}' se encuentra temporalmente inactivo.`
    );
  }
}
