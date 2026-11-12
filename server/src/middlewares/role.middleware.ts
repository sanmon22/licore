import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";

export function requireRoles(...allowedRoles: Array<"CUSTOMER" | "SUPERVISOR" | "ADMIN">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
}
