import { Router } from "express";
import { AuthController } from "./controllers/auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export const authRouter = Router();
const controller = new AuthController();

authRouter.post("/login", (req, res) => controller.login(req, res));
authRouter.post("/register", (req, res) => controller.registerCustomer(req, res));
authRouter.get("/me", authMiddleware, (req, res) => controller.getProfile(req, res));
