import express from "express";

import healthRouter from "./routes/health.js";
import organizationsRouter from "./routes/organizations.js";

import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/organizations", organizationsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;