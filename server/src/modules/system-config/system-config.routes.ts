import { Router } from "express";
import { SystemConfigController } from "./controllers/system-config.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";

export const systemConfigRouter = Router();
const controller = new SystemConfigController();

// GET /api/v1/config - Admin and Supervisor can view all operational parameters
systemConfigRouter.get(
  "/",
  authMiddleware,
  requireRoles("ADMIN", "SUPERVISOR"),
  (req, res) => controller.getAllConfigs(req, res)
);

// PUT /api/v1/config/:key - Only Admin can update parameters
systemConfigRouter.put(
  "/:key",
  authMiddleware,
  requireRoles("ADMIN"),
  (req, res) => controller.updateConfig(req, res)
);
