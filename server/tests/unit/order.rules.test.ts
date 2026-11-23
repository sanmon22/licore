import { describe, it, expect } from "vitest";
import {
  validateMinimumOrderQuantity,
  calculateShippingFee,
  resolveTieredUnitPrice,
  generateOrderCode,
  getPaymentMethodConfigKey,
  validatePaymentMethodActive,
  type PaymentMethod,
} from "../../src/modules/orders/domain/order.rules.js";
import { ProductPrice } from "../../src/db/schema.js";

export interface CanonicalProductFixture {
  id: number;
  sku: string;
  name: string;
  category: string;
  stockCases: number;
  bottlesPerCase: number;
}

export const FIXTURE_PRODUCTS: Record<string, CanonicalProductFixture> = {
  BUCHANANS_12: {
    id: 101,
    sku: "WHI-BUCH12-C12",
    name: "Whisky Buchanan's Deluxe 12 Años",
    category: "Whisky",
    stockCases: 50,
    bottlesPerCase: 12,
  },
  ZACAPA_23: {
    id: 102,
    sku: "RON-ZAC23-C06",
    name: "Ron Zacapa Centenario 23 Solera Gran Reserva",
    category: "Ron",
    stockCases: 25,
    bottlesPerCase: 6,
  },
  DON_JULIO_REPO: {
    id: 103,
    sku: "TEQ-DJUL-REP-C06",
    name: "Tequila Don Julio Reposado",
    category: "Tequila",
    stockCases: 15,
    bottlesPerCase: 6,
  },
  ANTIOQUENO_AZUL: {
    id: 104,
    sku: "AGU-ANT-AZU-C12",
    name: "Aguardiente Antioqueño Tapa Azul Sin Azúcar",
    category: "Aguardiente",
    stockCases: 100,
    bottlesPerCase: 12,
  },
};

export const FIXTURE_PRICES: ProductPrice[] = [
  { id: 1, productId: 101, customerType: "RETAIL", minCases: 1, unitPrice: 1850000 },

  { id: 2, productId: 101, customerType: "INDUSTRIAL", minCases: 1, unitPrice: 1650000 },
  { id: 3, productId: 101, customerType: "INDUSTRIAL", minCases: 5, unitPrice: 1550000 },
  { id: 4, productId: 101, customerType: "INDUSTRIAL", minCases: 10, unitPrice: 1480000 },

  { id: 5, productId: 102, customerType: "RETAIL", minCases: 1, unitPrice: 1420000 },

  { id: 6, productId: 102, customerType: "INDUSTRIAL", minCases: 3, unitPrice: 1300000 },
  { id: 7, productId: 102, customerType: "INDUSTRIAL", minCases: 6, unitPrice: 1220000 },

  { id: 8, productId: 103, customerType: "RETAIL", minCases: 1, unitPrice: 1750000 },
];

export const FIXTURE_SYSTEM_CONFIG = {
  logistics_min_cases_standard: { key: "logistics_min_cases_standard", value: 3, type: "NUMBER" },
  logistics_min_cases_express: { key: "logistics_min_cases_express", value: 1, type: "NUMBER" },
  logistics_express_fee_cop: { key: "logistics_express_fee_cop", value: 35000, type: "NUMBER" },
  logistics_express_reschedule_discount_cop: { key: "logistics_express_reschedule_discount_cop", value: 10000, type: "NUMBER" },
  logistics_express_enabled: { key: "logistics_express_enabled", value: true, type: "BOOLEAN" },
  payment_cod_enabled: { key: "payment_cod_enabled", value: true, type: "BOOLEAN" },
  payment_bank_transfer_enabled: { key: "payment_bank_transfer_enabled", value: true, type: "BOOLEAN" },
  payment_credit_card_enabled: { key: "payment_credit_card_enabled", value: true, type: "BOOLEAN" },
};

describe("Costura 1: Reglas de Dominio de Órdenes (order.rules.ts)", () => {

  describe("Característica 1: Validación de Cantidad Mínima de Pedido (validateMinimumOrderQuantity)", () => {
    it("SCN-MOQ-01: debe permitir pedido estándar cuando cumple exactamente el MOQ por defecto (3 cajas)", () => {
      expect(() => validateMinimumOrderQuantity(3, "STANDARD")).not.toThrow();
    });

    it("SCN-MOQ-02: debe permitir pedido estándar cuando supera holgadamente el MOQ por defecto (12 cajas)", () => {
      expect(() => validateMinimumOrderQuantity(12, "STANDARD")).not.toThrow();
    });

    it("SCN-MOQ-03: debe rechazar pedido estándar que no alcanza el MOQ por defecto (límite inferior: 2 cajas)", () => {
      expect(() => validateMinimumOrderQuantity(2, "STANDARD")).toThrow(
        "Pedido mínimo no alcanzado: El despacho estándar requiere al menos 3 cajas (solicitadas: 2)."
      );
    });

    it("SCN-MOQ-04: debe rechazar pedido estándar con cero cajas (0 cajas)", () => {
      expect(() => validateMinimumOrderQuantity(0, "STANDARD")).toThrow(
        "Pedido mínimo no alcanzado: El despacho estándar requiere al menos 3 cajas (solicitadas: 0)."
      );
    });

    it("SCN-MOQ-05: debe permitir pedido express nocturno cuando cumple el MOQ por defecto (1 caja)", () => {
      expect(() => validateMinimumOrderQuantity(1, "EXPRESS_EMERGENCY")).not.toThrow();
    });

    it("SCN-MOQ-06: debe permitir pedido express nocturno con volumen mayor (4 cajas)", () => {
      expect(() => validateMinimumOrderQuantity(4, "EXPRESS_EMERGENCY")).not.toThrow();
    });

    it("SCN-MOQ-07: debe rechazar pedido express nocturno con cero cajas (0 cajas)", () => {
      expect(() => validateMinimumOrderQuantity(0, "EXPRESS_EMERGENCY")).toThrow(
        "Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos 1 caja (solicitadas: 0)."
      );
    });

    it("SCN-MOQ-08: debe respetar parámetro dinámico de SystemConfig que eleva MOQ estándar a 5 cajas", () => {
      const minStd = 5;
      const minExp = 2;

      expect(() => validateMinimumOrderQuantity(4, "STANDARD", minStd, minExp)).toThrow(
        "Pedido mínimo no alcanzado: El despacho estándar requiere al menos 5 cajas (solicitadas: 4)."
      );

      expect(() => validateMinimumOrderQuantity(5, "STANDARD", minStd, minExp)).not.toThrow();
    });

    it("SCN-MOQ-09: debe respetar parámetro dinámico de SystemConfig que eleva MOQ express a 2 cajas", () => {
      const minStd = 5;
      const minExp = 2;

      expect(() => validateMinimumOrderQuantity(1, "EXPRESS_EMERGENCY", minStd, minExp)).toThrow(
        "Pedido mínimo no alcanzado: El despacho express nocturno requiere al menos 2 caja (solicitadas: 1)."
      );

      expect(() => validateMinimumOrderQuantity(2, "EXPRESS_EMERGENCY", minStd, minExp)).not.toThrow();
    });
  });

  describe("Característica 2: Cálculo de Fletes para Logística Dual (calculateShippingFee)", () => {
    it("SCN-SHP-01: debe retornar flete gratuito (0 COP) para despacho estándar por defecto", () => {
      expect(calculateShippingFee("STANDARD")).toBe(0);
    });

    it("SCN-SHP-02: debe mantener flete en 0 COP para despacho estándar incluso si se provee tarifa express", () => {
      expect(calculateShippingFee("STANDARD", 45000)).toBe(0);
    });

    it("SCN-SHP-03: debe retornar recargo fijo de 35.000 COP para despacho express nocturno por defecto", () => {
      expect(calculateShippingFee("EXPRESS_EMERGENCY")).toBe(35000);
    });

    it("SCN-SHP-04: debe respetar tarifa express dinámica configurable proveniente de SystemConfig (ej. 42.000 COP)", () => {
      expect(calculateShippingFee("EXPRESS_EMERGENCY", 42000)).toBe(42000);
    });
  });

  describe("Característica 3: Precios Escalonados y Aislamiento de Segmentos (resolveTieredUnitPrice)", () => {
    const buchanansPrices = FIXTURE_PRICES.filter((p) => p.productId === 101);

    it("SCN-PRC-01: debe aplicar precio base para cliente RETAIL comprando volumen bajo (1 caja)", () => {
      const result = resolveTieredUnitPrice(buchanansPrices, "RETAIL", 1);
      expect(result.unitPrice).toBe(1850000);
      expect(result.appliedMinCases).toBe(1);
    });

    it("SCN-PRC-02: cliente RETAIL comprando gran volumen (20 cajas) no debe acceder a tarifas con descuento INDUSTRIAL", () => {
      const result = resolveTieredUnitPrice(buchanansPrices, "RETAIL", 20);
      expect(result.unitPrice).toBe(1850000);
      expect(result.appliedMinCases).toBe(1);
      expect(result.unitPrice).not.toBe(1480000);
    });

    it("SCN-PRC-03: cliente INDUSTRIAL comprando en Escalón 1 (3 cajas) debe obtener precio de 1 a 4 cajas", () => {
      const result = resolveTieredUnitPrice(buchanansPrices, "INDUSTRIAL", 3);
      expect(result.unitPrice).toBe(1650000);
      expect(result.appliedMinCases).toBe(1);
    });

    it("SCN-PRC-04: cliente INDUSTRIAL comprando exactamente en el umbral del Escalón 2 (5 cajas) debe obtener tarifa reducida", () => {
      const result = resolveTieredUnitPrice(buchanansPrices, "INDUSTRIAL", 5);
      expect(result.unitPrice).toBe(1550000);
      expect(result.appliedMinCases).toBe(5);
    });

    it("SCN-PRC-05: cliente INDUSTRIAL comprando en rango intermedio del Escalón 2 (8 cajas) debe mantener tarifa de Escalón 2", () => {
      const result = resolveTieredUnitPrice(buchanansPrices, "INDUSTRIAL", 8);
      expect(result.unitPrice).toBe(1550000);
      expect(result.appliedMinCases).toBe(5);
    });

    it("SCN-PRC-06: cliente INDUSTRIAL comprando en Escalón 3 (15 cajas) debe obtener tarifa de volumen máximo", () => {
      const result = resolveTieredUnitPrice(buchanansPrices, "INDUSTRIAL", 15);
      expect(result.unitPrice).toBe(1480000);
      expect(result.appliedMinCases).toBe(10);
    });

    it("SCN-PRC-07: debe lanzar error canónico si no existen precios para el tipo de cliente solicitado", () => {
      const donJulioPrices = FIXTURE_PRICES.filter((p) => p.productId === 103);
      expect(() => resolveTieredUnitPrice(donJulioPrices, "INDUSTRIAL", 2)).toThrow(
        "No prices configured for customer type INDUSTRIAL"
      );
    });

    it("SCN-PRC-08: debe aplicar fallback al escalón base cuando la cantidad solicitada es menor al mínimo escalón configurado", () => {
      const zacapaPrices = FIXTURE_PRICES.filter((p) => p.productId === 102);
      const result = resolveTieredUnitPrice(zacapaPrices, "INDUSTRIAL", 1);
      expect(result.unitPrice).toBe(1300000);
      expect(result.appliedMinCases).toBe(3);
    });
  });

  describe("Característica 4: Generación Canónica de Códigos de Pedido (generateOrderCode)", () => {
    it("SCN-COD-01: debe generar un código de longitud 13 con formato ORD-YYMM-XXXX para fecha fija", () => {
      const fixedDate = new Date(2026, 10, 23);
      const code = generateOrderCode(fixedDate);

      expect(code).toHaveLength(13);
      expect(code.startsWith("ORD-2611-")).toBe(true);
      expect(code).toMatch(/^ORD-2611-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$/);
    });

    it("SCN-COD-02: ausencia total de caracteres ambiguos (I, L, O, U, 0, 1) en 100 iteraciones consecutivas", () => {
      const canonicalRegex = /^ORD-\d{2}(0[1-9]|1[0-2])-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$/;
      const ambiguousCharsRegex = /[ILOUilou01]/;

      for (let i = 0; i < 100; i++) {
        const code = generateOrderCode();
        expect(code).toHaveLength(13);
        expect(code).toMatch(canonicalRegex);

        const randomSuffix = code.split("-")[2];
        expect(randomSuffix).toHaveLength(4);
        expect(randomSuffix).not.toMatch(ambiguousCharsRegex);
      }
    });

    it("SCN-COD-03: debe operar de forma infalible sin argumentos usando la fecha del sistema", () => {
      const code = generateOrderCode();
      expect(code).toHaveLength(13);
      expect(code).toMatch(/^ORD-\d{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$/);
    });
  });

  describe("Característica 5: Validación de Pasarelas de Pago contra SystemConfig", () => {
    it("SCN-PAY-01: debe mapear correctamente cada método de pago a su clave en SystemConfig", () => {
      expect(getPaymentMethodConfigKey("CASH_ON_DELIVERY")).toBe("payment_cod_enabled");
      expect(getPaymentMethodConfigKey("BANK_TRANSFER")).toBe("payment_bank_transfer_enabled");
      expect(getPaymentMethodConfigKey("CREDIT_CARD")).toBe("payment_credit_card_enabled");
      expect(getPaymentMethodConfigKey("CREDIT")).toBe("payment_credit_card_enabled");
    });

    it("SCN-PAY-02: debe permitir transacciones con métodos de pago activos (isEnabled = true)", () => {
      const activeMethods: PaymentMethod[] = ["CASH_ON_DELIVERY", "BANK_TRANSFER", "CREDIT_CARD", "CREDIT"];
      for (const method of activeMethods) {
        expect(() => validatePaymentMethodActive(method, true)).not.toThrow();
      }
    });

    it("SCN-PAY-03: debe rechazar método Contra Entrega temporalmente inactivo con mensaje amigable", () => {
      expect(() => validatePaymentMethodActive("CASH_ON_DELIVERY", false)).toThrow(
        "El método de pago 'Contra Entrega (Efectivo/Datáfono)' se encuentra temporalmente inactivo."
      );
    });

    it("SCN-PAY-04: debe rechazar método Transferencia Bancaria inactivo con mensaje amigable", () => {
      expect(() => validatePaymentMethodActive("BANK_TRANSFER", false)).toThrow(
        "El método de pago 'Transferencia Bancaria' se encuentra temporalmente inactivo."
      );
    });

    it("SCN-PAY-05: debe rechazar método Tarjeta de Crédito / Crédito inactivo con mensaje amigable", () => {
      expect(() => validatePaymentMethodActive("CREDIT_CARD", false)).toThrow(
        "El método de pago 'Tarjeta de Crédito / Pasarela' se encuentra temporalmente inactivo."
      );
      expect(() => validatePaymentMethodActive("CREDIT", false)).toThrow(
        "El método de pago 'Tarjeta de Crédito / Pasarela' se encuentra temporalmente inactivo."
      );
    });

    it("SCN-PAY-06: debe arrojar error descriptivo al consultar clave de método no reconocido por el sistema", () => {
      expect(() => getPaymentMethodConfigKey("BITCOIN_LIGHTNING" as unknown as PaymentMethod)).toThrow(
        "Método de pago no reconocido: BITCOIN_LIGHTNING"
      );
    });

    it("SCN-PAY-07: debe manejar fallback con el identificador del método si el nombre amigable no está en el mapa", () => {
      expect(() => validatePaymentMethodActive("CRIPTO_PAY" as unknown as PaymentMethod, false)).toThrow(
        "El método de pago 'CRIPTO_PAY' se encuentra temporalmente inactivo."
      );
    });
  });
});
