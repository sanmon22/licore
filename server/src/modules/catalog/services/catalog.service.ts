import { db } from "../../../db/index.js";
import { products, productPrices, Product, ProductPrice } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { CreateProductInput, UpdateStockInput } from "../domain/catalog.types.js";

export class CatalogService {
  async listProducts(customerType: "RETAIL" | "INDUSTRIAL" = "RETAIL") {
    const allProducts = await db.select().from(products);
    const allPrices = await db.select().from(productPrices);

    return allProducts.map((prod: Product) => {
      const prodPrices = allPrices.filter((p: ProductPrice) => p.productId === prod.id);
      const relevantPrices = prodPrices
        .filter((p: ProductPrice) => p.customerType === customerType)
        .sort((a: ProductPrice, b: ProductPrice) => a.minCases - b.minCases);

      const basePrice = relevantPrices[0]?.unitPrice ?? 0;

      return {
        ...prod,
        basePrice,
        priceTiers: relevantPrices,
        allTiers: prodPrices,
      };
    });
  }

  async getProductById(id: number, customerType: "RETAIL" | "INDUSTRIAL" = "RETAIL") {
    const prod = (await db.select().from(products).where(eq(products.id, id)))[0];
    if (!prod) {
      throw new Error("Product not found");
    }

    const prodPrices = await db.select().from(productPrices).where(eq(productPrices.productId, prod.id));
    const relevantPrices = prodPrices
      .filter((p: ProductPrice) => p.customerType === customerType)
      .sort((a: ProductPrice, b: ProductPrice) => a.minCases - b.minCases);

    return {
      ...prod,
      basePrice: relevantPrices[0]?.unitPrice ?? 0,
      priceTiers: relevantPrices,
      allTiers: prodPrices,
    };
  }

  async updateStock(id: number, input: UpdateStockInput) {
    const [updated] = await db
      .update(products)
      .set({ stockCases: input.stockCases })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      throw new Error("Product not found");
    }
    return updated;
  }

  async createProduct(input: CreateProductInput) {
    const now = new Date().toISOString();

    const [newProd] = await db.insert(products).values({
      sku: input.sku,
      name: input.name,
      category: input.category,
      stockCases: input.stockCases,
      bottlesPerCase: input.bottlesPerCase,
      imageUrl: input.imageUrl || null,
      createdAt: now,
    }).returning();

    for (const pr of input.prices) {
      await db.insert(productPrices).values({
        productId: newProd.id,
        customerType: pr.customerType,
        minCases: pr.minCases,
        unitPrice: pr.unitPrice,
      });
    }

    return this.getProductById(newProd.id);
  }
}
