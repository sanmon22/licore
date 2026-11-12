import { Router } from "express";
import { CustomerController } from "./controllers/customer.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";

export const customerRouter = Router();
const controller = new CustomerController();

customerRouter.get("/branches", authMiddleware, (req, res) => controller.getMyBranches(req, res));
customerRouter.post("/branches", authMiddleware, (req, res) => controller.addBranch(req, res));

// Admin & Supervisor: view all registered business customers
customerRouter.get("/", authMiddleware, requireRoles("ADMIN", "SUPERVISOR"), (req, res) =>
  controller.getAllCustomers(req, res)
);
