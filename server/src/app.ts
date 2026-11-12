import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./modules/auth/auth.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { customerRouter } from "./modules/customers/customer.routes.js";
import { orderRouter } from "./modules/orders/order.routes.js";

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "liquor-distributor-ecommerce-api",
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/orders", orderRouter);

// Global 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
