import { Response } from "express";
import { OrderService } from "../services/order.service.js";
import {
  checkoutSchema,
  calculateCartSchema,
  updateOrderStatusSchema,
} from "../domain/order.types.js";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware.js";

const service = new OrderService();

export class OrderController {
  async calculateCart(req: AuthenticatedRequest, res: Response) {
    try {
      const customerType = req.user?.customerType || (req.body.customerType as "RETAIL" | "INDUSTRIAL") || "RETAIL";
      const parsed = calculateCartSchema.parse(req.body);
      const result = await service.calculateCart(customerType, parsed);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async checkout(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.customerId) {
        return res.status(400).json({ error: "Only registered customers can place orders" });
      }
      const customerType = req.user.customerType || "RETAIL";
      const parsed = checkoutSchema.parse(req.body);
      const order = await service.checkout(req.user.customerId, customerType, parsed);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getMyOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.customerId) {
        return res.status(400).json({ error: "No customer profile found" });
      }
      const orders = await service.getCustomerOrders(req.user.customerId);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getOrderById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const order = await service.getOrderById(id);

      // Customer can only view their own order
      if (req.user?.role === "CUSTOMER" && order.customerId !== req.user.customerId) {
        return res.status(403).json({ error: "Forbidden: Not your order" });
      }

      res.json(order);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const parsed = updateOrderStatusSchema.parse(req.body);
      const updated = await service.updateOrderStatus(id, parsed.status);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAllOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const allOrders = await service.getAllOrders();
      res.json(allOrders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
