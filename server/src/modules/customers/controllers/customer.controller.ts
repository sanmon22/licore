import { Response } from "express";
import { CustomerService } from "../services/customer.service.js";
import { createBranchSchema } from "../domain/customer.types.js";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware.js";

const service = new CustomerService();

export class CustomerController {
  async getMyBranches(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.customerId) {
        return res.status(400).json({ error: "Customer profile not linked to this user" });
      }
      const branches = await service.getBranches(req.user.customerId);
      res.json(branches);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async addBranch(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.customerId) {
        return res.status(400).json({ error: "Customer profile not linked to this user" });
      }
      const parsed = createBranchSchema.parse(req.body);
      const branch = await service.addBranch(req.user.customerId, parsed);
      res.status(201).json(branch);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
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
