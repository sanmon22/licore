import path from "node:path";
import { type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Asegurar aislamiento de persistencia sobre data.test.db antes de importar la app
process.env.NODE_ENV = "test";
process.env.DB_PATH = path.resolve(process.cwd(), "data.test.db");

const { app } = await import("../../src/app.js");
const { seedDatabase } = await import("../../src/db/seed.js");

describe("Fase 3: Pruebas de API HTTP & Seguridad RBAC (order.routes.ts)", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await seedDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  // --------------------------------------------------------------------------
  // TEST 1: SCN-API-01
  // --------------------------------------------------------------------------
  it("[SCN-API-01] - POST /api/v1/orders/calculate-cart permite cotizar sin autenticación y responde HTTP 200 con subtotales y flete", async () => {
    const payload = {
      deliveryType: "STANDARD",
      items: [
        { productId: 1, casesQuantity: 3 },
      ],
    };

    const res = await fetch(`${baseUrl}/api/v1/orders/calculate-cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subtotal).toBeDefined();
    expect(data.shippingFee).toBe(0);
    expect(data.grandTotal).toBeDefined();
    expect(data.totalCases).toBe(3);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].productId).toBe(1);
  });

  // --------------------------------------------------------------------------
  // TEST 2: SCN-API-02
  // --------------------------------------------------------------------------
  it("[SCN-API-02] - POST /api/v1/orders/checkout rechaza petición sin Authorization respondiendo HTTP 401", async () => {
    const payload = {
      deliveryPlaceId: 1,
      contactName: "Mateo Gómez",
      contactPhone: "+57 3001234567",
      paymentMethod: "CASH_ON_DELIVERY",
      deliveryType: "STANDARD",
      items: [{ productId: 1, casesQuantity: 3 }],
    };

    const res = await fetch(`${baseUrl}/api/v1/orders/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Authentication token required");
  });

  // TODO: [SCN-API-03] - POST /api/v1/orders/checkout procesa compra exitosa con token Bearer de CUSTOMER y responde 201
  // TODO: [SCN-API-04] - POST /api/v1/orders/checkout rechaza con 403 si el usuario autenticado no tiene rol CUSTOMER
  // TODO: [SCN-API-05] - POST /api/v1/orders/:id/reschedule-express autoriza reprogramación con 200 para roles ADMIN y SUPERVISOR
  // TODO: [SCN-API-06] - POST /api/v1/orders/:id/reschedule-express rechaza con 403 a usuarios con rol CUSTOMER
  // TODO: [SCN-API-07] - GET /api/v1/system-config solo permite acceso con 200 a ADMIN/SUPERVISOR y rechaza a clientes
});
