import { db } from "../../../db/index.js";
import {
  orders,
  orderItems,
  products,
  productPrices,
  branches,
  customers,
  Product,
  ProductPrice,
  Order,
  OrderItem,
  Branch,
  Customer,
} from "../../../db/schema.js";
import { eq, inArray, desc } from "drizzle-orm";
import { CheckoutInput, CalculateCartInput } from "../domain/order.types.js";
import { resolveTieredUnitPrice } from "../domain/order.rules.js";

export class OrderService {
  async calculateCart(customerType: "RETAIL" | "INDUSTRIAL", input: CalculateCartInput) {
    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await db.select().from(products).where(inArray(products.id, productIds));
    const dbPrices = await db.select().from(productPrices).where(inArray(productPrices.productId, productIds));

    let grandTotal = 0;
    const calculatedItems = input.items.map((item) => {
      const prod = dbProducts.find((p: Product) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      const prodPrices = dbPrices.filter((p: ProductPrice) => p.productId === prod.id);
      const { unitPrice, appliedMinCases } = resolveTieredUnitPrice(
        prodPrices,
        customerType,
        item.casesQuantity
      );

      const subtotal = Number((unitPrice * item.casesQuantity).toFixed(2));
      grandTotal += subtotal;

      return {
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        casesQuantity: item.casesQuantity,
        stockAvailable: prod.stockCases,
        hasSufficientStock: prod.stockCases >= item.casesQuantity,
        unitPrice,
        appliedMinCases,
        subtotal,
      };
    });

    return {
      items: calculatedItems,
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }

  async checkout(customerId: number, customerType: "RETAIL" | "INDUSTRIAL", input: CheckoutInput) {
    // 1. Validate branch belongs to customer
    const branch = (
      await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.branchId))
    )[0];

    if (!branch || branch.customerId !== customerId) {
      throw new Error("Invalid delivery branch selected for this customer");
    }

    const productIds = input.items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const dbPrices = await db
      .select()
      .from(productPrices)
      .where(inArray(productPrices.productId, productIds));

    let orderTotal = 0;
    const itemsToInsert: Array<{
      productId: number;
      casesQuantity: number;
      unitPrice: number;
      subtotal: number;
    }> = [];

    // Validate stock and calculate prices
    for (const item of input.items) {
      const prod = dbProducts.find((p: Product) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product #${item.productId} does not exist`);
      }

      if (prod.stockCases < item.casesQuantity) {
        throw new Error(
          `Insufficient stock for "${prod.name}". Requested: ${item.casesQuantity} cases, Available: ${prod.stockCases} cases.`
        );
      }

      const prodPrices = dbPrices.filter((p: ProductPrice) => p.productId === prod.id);
      const { unitPrice } = resolveTieredUnitPrice(
        prodPrices,
        customerType,
        item.casesQuantity
      );

      const subtotal = Number((unitPrice * item.casesQuantity).toFixed(2));
      orderTotal += subtotal;

      itemsToInsert.push({
        productId: prod.id,
        casesQuantity: item.casesQuantity,
        unitPrice,
        subtotal,
      });
    }

    // 2. Decrement warehouse stock for each product
    for (const item of input.items) {
      const prod = dbProducts.find((p: Product) => p.id === item.productId)!;
      await db
        .update(products)
        .set({ stockCases: prod.stockCases - item.casesQuantity })
        .where(eq(products.id, prod.id));
    }

    const now = new Date().toISOString();
    const code = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 3. Insert Order
    const [newOrder] = await db
      .insert(orders)
      .values({
        code,
        customerId,
        branchId: input.branchId,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        paymentMethod: input.paymentMethod,
        status: "PENDING",
        total: Number(orderTotal.toFixed(2)),
        notes: input.notes || null,
        createdAt: now,
      })
      .returning();

    // 4. Insert Order Items
    for (const it of itemsToInsert) {
      await db
        .insert(orderItems)
        .values({
          orderId: newOrder.id,
          productId: it.productId,
          casesQuantity: it.casesQuantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        });
    }

    return this.getOrderById(newOrder.id);
  }

  async cancelOrder(orderId: number) {
    const order = (
      await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
    )[0];

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "CANCELLED") {
      throw new Error("Order is already cancelled");
    }

    // Fetch items to reimburse stock
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      const prod = (
        await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
      )[0];

      if (prod) {
        await db
          .update(products)
          .set({ stockCases: prod.stockCases + item.casesQuantity })
          .where(eq(products.id, prod.id));
      }
    }

    await db
      .update(orders)
      .set({ status: "CANCELLED" })
      .where(eq(orders.id, orderId));

    return this.getOrderById(orderId);
  }

  async updateOrderStatus(
    orderId: number,
    status: "PENDING" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED"
  ) {
    if (status === "CANCELLED") {
      return this.cancelOrder(orderId);
    }

    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updated) {
      throw new Error("Order not found");
    }

    return this.getOrderById(orderId);
  }

  async getCustomerOrders(customerId: number) {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.id));

    const allBranches = await db.select().from(branches);
    const allItems = await db.select().from(orderItems);
    const allProducts = await db.select().from(products);

    return customerOrders.map((ord: Order) => {
      const branch = allBranches.find((b: Branch) => b.id === ord.branchId);
      const items = allItems
        .filter((i: OrderItem) => i.orderId === ord.id)
        .map((i: OrderItem) => {
          const prod = allProducts.find((p: Product) => p.id === i.productId);
          return {
            ...i,
            productName: prod?.name || "Desconocido",
            productSku: prod?.sku || "",
            imageUrl: prod?.imageUrl || null,
          };
        });

      return {
        ...ord,
        branch,
        items,
      };
    });
  }

  async getAllOrders() {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.id));
    const allCustomers = await db.select().from(customers);
    const allBranches = await db.select().from(branches);
    const allItems = await db.select().from(orderItems);
    const allProducts = await db.select().from(products);

    return allOrders.map((ord: Order) => {
      const customer = allCustomers.find((c: Customer) => c.id === ord.customerId);
      const branch = allBranches.find((b: Branch) => b.id === ord.branchId);
      const items = allItems
        .filter((i: OrderItem) => i.orderId === ord.id)
        .map((i: OrderItem) => {
          const prod = allProducts.find((p: Product) => p.id === i.productId);
          return {
            ...i,
            productName: prod?.name || "Desconocido",
            productSku: prod?.sku || "",
          };
        });

      return {
        ...ord,
        customer,
        branch,
        items,
      };
    });
  }

  async getOrderById(orderId: number) {
    const order = (await db.select().from(orders).where(eq(orders.id, orderId)))[0];
    if (!order) {
      throw new Error("Order not found");
    }

    const customer = (
      await db.select().from(customers).where(eq(customers.id, order.customerId))
    )[0];
    const branch = (
      await db.select().from(branches).where(eq(branches.id, order.branchId))
    )[0];
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    const allProducts = await db.select().from(products);

    const detailedItems = items.map((i: OrderItem) => {
      const prod = allProducts.find((p: Product) => p.id === i.productId);
      return {
        ...i,
        productName: prod?.name || "Desconocido",
        productSku: prod?.sku || "",
        imageUrl: prod?.imageUrl || null,
      };
    });

    return {
      ...order,
      customer,
      branch,
      items: detailedItems,
    };
  }
}
