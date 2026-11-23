import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";

// Asegurar aislamiento de persistencia sobre data.test.db antes de importar módulos
process.env.NODE_ENV = "test";
process.env.DB_PATH = path.resolve(process.cwd(), "data.test.db");

const { db } = await import("../../src/db/index.js");
const { seedDatabase } = await import("../../src/db/seed.js");
const { OrderService } = await import("../../src/modules/orders/services/order.service.js");
const { products, orders } = await import("../../src/db/schema.js");
const { eq } = await import("drizzle-orm");

describe("Fase 2: Pruebas de Integración de Servicios (order.service.ts)", () => {
  let orderService: InstanceType<typeof OrderService>;

  beforeAll(async () => {
    await seedDatabase();
    orderService = new OrderService();
  });

  // --------------------------------------------------------------------------
  // TEST 1: SCN-INT-01
  // --------------------------------------------------------------------------
  it("[SCN-INT-01] - checkout descuenta correctamente las cajas vendidas de products.stockCases y persiste la orden", async () => {
    // Tomar producto 1 (Ron Medellín 3 años) y verificar stock inicial
    const [initialProduct] = await db.select().from(products).where(eq(products.id, 1));
    expect(initialProduct).toBeDefined();
    const initialStock = initialProduct.stockCases;
    const casesToOrder = 3; // Cumple MOQ estándar de 3 cajas

    // Ejecutar checkout con Customer 1 (El Refugio - INDUSTRIAL)
    const createdOrder = await orderService.checkout(1, "INDUSTRIAL", {
      deliveryPlaceId: 1,
      contactName: "Mateo Gómez",
      contactPhone: "+57 3001234567",
      paymentMethod: "CASH_ON_DELIVERY",
      deliveryType: "STANDARD",
      items: [{ productId: 1, casesQuantity: casesToOrder }],
    });

    // 1. Verificar persistencia de la orden
    expect(createdOrder).toBeDefined();
    expect(createdOrder.id).toBeDefined();
    expect(createdOrder.code).toMatch(/^ORD-\d{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4}$/);
    expect(createdOrder.status).toBe("PENDING");
    expect(createdOrder.customerId).toBe(1);
    expect(createdOrder.items.length).toBe(1);
    expect(createdOrder.items[0].casesQuantity).toBe(casesToOrder);

    // 2. Verificar descuento atómico en el stock del inventario
    const [updatedProduct] = await db.select().from(products).where(eq(products.id, 1));
    expect(updatedProduct.stockCases).toBe(initialStock - casesToOrder);
  });

  // --------------------------------------------------------------------------
  // TEST 2: SCN-INT-02
  // --------------------------------------------------------------------------
  it("[SCN-INT-02] - rescheduleExpressOrder aplica descuento de -$10.000 COP al flete y total, e inserta marca en notas", async () => {
    // 1. Crear una orden express nocturna inicial
    const expressOrder = await orderService.checkout(1, "INDUSTRIAL", {
      deliveryPlaceId: 1,
      contactName: "Mateo Gómez",
      contactPhone: "+57 3001234567",
      paymentMethod: "CASH_ON_DELIVERY",
      deliveryType: "EXPRESS_EMERGENCY",
      items: [{ productId: 1, casesQuantity: 1 }], // MOQ express = 1 caja
    });

    const initialShippingFee = expressOrder.shippingFee; // 35000 COP
    const initialTotal = expressOrder.total;
    const discountExpected = 10000;

    // 2. Ejecutar reprogramación express
    const adminReason = "Saturación de flota en ruta nocturna";
    const rescheduledOrder = await orderService.rescheduleExpressOrder(expressOrder.id, adminReason);

    // 3. Verificar deducción de tarifa de flete y total
    expect(rescheduledOrder.shippingFee).toBe(initialShippingFee - discountExpected);
    expect(rescheduledOrder.total).toBe(Number((initialTotal - discountExpected).toFixed(2)));

    // 4. Verificar inserción de la marca canónica y motivo en las notas
    expect(rescheduledOrder.notes).toContain("[REPROGRAMADO PRIORITARIO]");
    expect(rescheduledOrder.notes).toContain(`-$${discountExpected} COP`);
    expect(rescheduledOrder.notes).toContain(adminReason);

    // 5. Verificar persistencia directa en la base de datos de pruebas
    const [persistedOrder] = await db.select().from(orders).where(eq(orders.id, expressOrder.id));
    expect(persistedOrder.shippingFee).toBe(initialShippingFee - discountExpected);
    expect(persistedOrder.total).toBe(Number((initialTotal - discountExpected).toFixed(2)));
    expect(persistedOrder.notes).toContain("[REPROGRAMADO PRIORITARIO]");
  });

  // TODO: [SCN-INT-03] - cancelOrder reintegra automáticamente las cajas de inventario a products.stockCases y emite notificación
  // TODO: [SCN-INT-04] - checkout arroja excepción y hace rollback si el inventario solicitado supera el stock disponible
  // TODO: [SCN-INT-05] - checkout rechaza la transacción si el método de pago está desactivado en system_config
  // TODO: [SCN-INT-06] - calculateCart computa subtotales, MOQ dinámico y fletes exactos desde system_config
});
