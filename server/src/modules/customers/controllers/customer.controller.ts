import { Response } from "express";
import { CustomerService } from "../services/customer.service.js";
import { createDeliveryPlaceSchema } from "../domain/customer.types.js";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware.js";

const service = new CustomerService();

export class CustomerController {
  async getMyDeliveryPlaces(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.customerId) {
        return res.status(400).json({ error: "Customer profile not linked to this user" });
      }
      const places = await service.getDeliveryPlaces(req.user.customerId);
      res.json(places);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Alias for backward compatibility
  async getMyBranches(req: AuthenticatedRequest, res: Response) {
    return this.getMyDeliveryPlaces(req, res);
  }

  async addDeliveryPlace(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.customerId) {
        return res.status(400).json({ error: "Customer profile not linked to this user" });
      }
      const parsed = createDeliveryPlaceSchema.parse(req.body);
      const place = await service.addDeliveryPlace(req.user.customerId, parsed);
      res.status(201).json(place);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // Alias for backward compatibility
  async addBranch(req: AuthenticatedRequest, res: Response) {
    return this.addDeliveryPlace(req, res);
  }

  async getAllCustomers(req: AuthenticatedRequest, res: Response) {
    try {
      const customers = await service.getAllCustomers();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
