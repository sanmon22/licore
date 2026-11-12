import { Response } from "express";
import { CatalogService } from "../services/catalog.service.js";
import { createProductSchema, updateStockSchema } from "../domain/catalog.types.js";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware.js";

const service = new CatalogService();

export class CatalogController {
  async listProducts(req: AuthenticatedRequest, res: Response) {
    try {
      const customerType = req.user?.customerType || (req.query.customerType as "RETAIL" | "INDUSTRIAL") || "RETAIL";
      const products = await service.listProducts(customerType);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const customerType = req.user?.customerType || (req.query.customerType as "RETAIL" | "INDUSTRIAL") || "RETAIL";
      const product = await service.getProductById(id, customerType);
      res.json(product);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateStock(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const parsed = updateStockSchema.parse(req.body);
      const updated = await service.updateStock(id, parsed);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async createProduct(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = createProductSchema.parse(req.body);
      const created = await service.createProduct(parsed);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
