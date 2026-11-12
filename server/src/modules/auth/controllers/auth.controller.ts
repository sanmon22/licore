import { Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { loginSchema, registerCustomerSchema } from "../domain/auth.types.js";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware.js";

const authService = new AuthService();

export class AuthController {
  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.login(parsed);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async registerCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = registerCustomerSchema.parse(req.body);
      const result = await authService.registerCustomer(parsed);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const profile = await authService.getProfile(req.user.id);
      res.json(profile);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
