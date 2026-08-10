import express from "express";
import { prisma } from "../../../packages/database/index.js";

const app = express();

app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "healthy",
      application: "ORNEXIS ONE",
      version: process.env.APP_VERSION || "1.0.0",
      database: "connected"
    });
  } catch {
    res.status(503).json({
      status: "unhealthy",
      application: "ORNEXIS ONE",
      version: process.env.APP_VERSION || "1.0.0",
      database: "disconnected"
    });
  }
});

export default app;