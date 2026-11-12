import { sqlite, db } from "./index.js";
import {
  users,
  customers,
  branches,
  products,
  productPrices,
} from "./schema.js";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Starting e-commerce database seeding...");

  // Create tables if they do not exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT NOT NULL,
      tax_id TEXT NOT NULL,
      customer_type TEXT NOT NULL DEFAULT 'RETAIL',
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      stock_cases INTEGER NOT NULL DEFAULT 0,
      bottles_per_case INTEGER NOT NULL DEFAULT 12,
      image_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_type TEXT NOT NULL,
      min_cases INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      payment_method TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY',
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      cases_quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );
  `);

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Seed Staff Users
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    console.log("  -> Seeding Users & Customers...");

    // Admin
    await db.insert(users).values({
      email: "admin@licores.com",
      name: "Administrador Central",
      passwordHash,
      role: "ADMIN",
      createdAt: now,
    });

    // Supervisor
    await db.insert(users).values({
      email: "supervisor@licores.com",
      name: "Carlos Mendoza (Supervisor)",
      passwordHash,
      role: "SUPERVISOR",
      createdAt: now,
    });

    // Customer 1: Industrial (Bar/Restaurante)
    const [userCust1] = await db.insert(users).values({
      email: "refugio@licores.com",
      name: "Mateo Gómez (El Refugio)",
      passwordHash,
      role: "CUSTOMER",
      createdAt: now,
    }).returning();

    const [c1] = await db.insert(customers).values({
      userId: userCust1.id,
      businessName: "Restaurante Bar El Refugio S.A.S.",
      taxId: "900.123.456-1",
      customerType: "INDUSTRIAL",
      phone: "+57 3001234567",
      createdAt: now,
    }).returning();

    await db.insert(branches).values([
      {
        customerId: c1.id,
        name: "Sede Poblado",
        address: "Cra 43A # 1-50",
        city: "Medellín",
        phone: "+57 4 4441234",
        createdAt: now,
      },
      {
        customerId: c1.id,
        name: "Sede Laureles",
        address: "Circular 73B # 39-10",
        city: "Medellín",
        phone: "+57 4 4445678",
        createdAt: now,
      },
    ]);

    // Customer 2: Industrial (Discoteca)
    const [userCust2] = await db.insert(users).values({
      email: "laoctava@licores.com",
      name: "Sebastián Ríos (La Octava)",
      passwordHash,
      role: "CUSTOMER",
      createdAt: now,
    }).returning();

    const [c2] = await db.insert(customers).values({
      userId: userCust2.id,
      businessName: "Discoteca La Octava Club",
      taxId: "901.987.654-2",
      customerType: "INDUSTRIAL",
      phone: "+57 3105559988",
      createdAt: now,
    }).returning();

    await db.insert(branches).values({
      customerId: c2.id,
      name: "Sede Parque Lleras",
      address: "Calle 10 # 38-20",
      city: "Medellín",
      phone: "+57 4 3110099",
      createdAt: now,
    });

    // Customer 3: Retail (Consumidor o Licorera pequeña)
    const [userCust3] = await db.insert(users).values({
      email: "donmario@licores.com",
      name: "Mario Henao",
      passwordHash,
      role: "CUSTOMER",
      createdAt: now,
    }).returning();

    const [c3] = await db.insert(customers).values({
      userId: userCust3.id,
      businessName: "Licorera & Minimarket Don Mario",
      taxId: "71.234.567-8",
      customerType: "RETAIL",
      phone: "+57 3154443322",
      createdAt: now,
    }).returning();

    await db.insert(branches).values({
      customerId: c3.id,
      name: "Punto de Venta Envigado",
      address: "Calle 37 Sur # 40-15",
      city: "Envigado",
      phone: "+57 4 2761122",
      createdAt: now,
    });
  }

  // 2. Seed Products and Tiered Prices
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    console.log("  -> Seeding Catalog and Volume Tiered Prices...");

    const sampleProducts = [
      {
        sku: "RON-MED-03",
        name: "Ron Medellín Añejo 3 Años (750ml)",
        category: "Ron",
        stockCases: 80,
        bottlesPerCase: 12,
        imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80",
        prices: [
          { customerType: "RETAIL" as const, minCases: 1, unitPrice: 120.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 1, unitPrice: 105.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 5, unitPrice: 98.0 },
        ],
      },
      {
        sku: "RON-ZAC-23",
        name: "Ron Zacapa Centenario 23 (750ml)",
        category: "Ron",
        stockCases: 35,
        bottlesPerCase: 6,
        imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
        prices: [
          { customerType: "RETAIL" as const, minCases: 1, unitPrice: 320.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 1, unitPrice: 290.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 3, unitPrice: 275.0 },
        ],
      },
      {
        sku: "WHI-BUC-12",
        name: "Whisky Buchanan's Deluxe 12 Años (750ml)",
        category: "Whisky",
        stockCases: 60,
        bottlesPerCase: 12,
        imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80",
        prices: [
          { customerType: "RETAIL" as const, minCases: 1, unitPrice: 360.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 1, unitPrice: 330.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 5, unitPrice: 310.0 },
        ],
      },
      {
        sku: "WHI-JWB-12",
        name: "Whisky Johnnie Walker Black Label (750ml)",
        category: "Whisky",
        stockCases: 50,
        bottlesPerCase: 12,
        imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
        prices: [
          { customerType: "RETAIL" as const, minCases: 1, unitPrice: 340.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 1, unitPrice: 315.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 5, unitPrice: 295.0 },
        ],
      },
      {
        sku: "TEQ-DJB-01",
        name: "Tequila Don Julio Blanco (700ml)",
        category: "Tequila",
        stockCases: 40,
        bottlesPerCase: 6,
        imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80",
        prices: [
          { customerType: "RETAIL" as const, minCases: 1, unitPrice: 260.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 1, unitPrice: 235.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 4, unitPrice: 220.0 },
        ],
      },
      {
        sku: "GIN-TAN-01",
        name: "Ginebra Tanqueray London Dry (750ml)",
        category: "Ginebra",
        stockCases: 45,
        bottlesPerCase: 12,
        imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
        prices: [
          { customerType: "RETAIL" as const, minCases: 1, unitPrice: 280.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 1, unitPrice: 250.0 },
          { customerType: "INDUSTRIAL" as const, minCases: 5, unitPrice: 235.0 },
        ],
      },
    ];

    for (const prod of sampleProducts) {
      const [insertedProduct] = await db.insert(products).values({
        sku: prod.sku,
        name: prod.name,
        category: prod.category,
        stockCases: prod.stockCases,
        bottlesPerCase: prod.bottlesPerCase,
        imageUrl: prod.imageUrl,
        createdAt: now,
      }).returning();

      for (const price of prod.prices) {
        await db.insert(productPrices).values({
          productId: insertedProduct.id,
          customerType: price.customerType,
          minCases: price.minCases,
          unitPrice: price.unitPrice,
        });
      }
    }
  }

  console.log("✅ Seeding completed successfully!");
}

if (process.argv[1]?.includes("seed")) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seeding failed:", err);
      process.exit(1);
    });
}
