import { Router } from "express";
import { CatalogController } from "./controllers/catalog.controller.js";
import { optionalAuthMiddleware, authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";

export const catalogRouter = Router();
const controller = new CatalogController();

// Public / customer catalog browsing (customized pricing if logged in)
catalogRouter.get("/", optionalAuthMiddleware, (req, res) => controller.listProducts(req, res));
catalogRouter.get("/:id", optionalAuthMiddleware, (req, res) => controller.getProduct(req, res));

// Admin & Supervisor operations
catalogRouter.patch("/:id/stock", authMiddleware, requireRoles("ADMIN", "SUPERVISOR"), (req, res) =>
  controller.updateStock(req, res)
);
catalogRouter.post("/", authMiddleware, requireRoles("ADMIN"), (req, res) => controller.createProduct(req, res));
