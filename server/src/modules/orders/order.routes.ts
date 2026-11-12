import { Router } from "express";
import { OrderController } from "./controllers/order.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";

export const orderRouter = Router();
const controller = new OrderController();

// Cart simulation (calculate dynamic tiers with or without auth)
orderRouter.post("/calculate-cart", optionalAuthMiddleware, (req, res) =>
  controller.calculateCart(req, res)
);

// Customer checkout & history
orderRouter.post("/checkout", authMiddleware, requireRoles("CUSTOMER"), (req, res) =>
  controller.checkout(req, res)
);
orderRouter.get("/my-orders", authMiddleware, requireRoles("CUSTOMER"), (req, res) =>
  controller.getMyOrders(req, res)
);
orderRouter.get("/:id", authMiddleware, (req, res) => controller.getOrderById(req, res));

// Admin & Supervisor operations
orderRouter.get("/", authMiddleware, requireRoles("ADMIN", "SUPERVISOR"), (req, res) =>
  controller.getAllOrders(req, res)
);
orderRouter.patch("/:id/status", authMiddleware, requireRoles("ADMIN", "SUPERVISOR"), (req, res) =>
  controller.updateStatus(req, res)
);
