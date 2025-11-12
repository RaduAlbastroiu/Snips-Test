import { Router } from "express";

export const healthRoutes = Router();

healthRoutes.get("/check", (_req, res) => {
  console.log("health check");
  res.json({ status: "ok" });
});
