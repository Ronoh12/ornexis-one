import type { Request, Response } from "express";
import { checkDatabaseHealth } from "../services/healthService.js";

export async function getHealth(
  _req: Request,
  res: Response
) {
  try {
    const health = await checkDatabaseHealth();

    res.json({
      status: "healthy",
      application: "ORNEXIS ONE",
      version: process.env.APP_VERSION || "1.0.0",
      database: health.database
    });
  } catch {
    res.status(503).json({
      status: "unhealthy",
      application: "ORNEXIS ONE",
      version: process.env.APP_VERSION || "1.0.0",
      database: "disconnected"
    });
  }
}