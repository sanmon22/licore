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
