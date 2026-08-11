import express from "express";

import healthRouter from "./routes/health.js";
import organizationsRouter from "./routes/organizations.js";
import usersRouter from "./routes/users.js";
import rolesRouter from "./routes/roles.js";
import organizationUsersRouter from "./routes/organizationUsers.js";

import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/organizations", organizationsRouter);
app.use("/users", usersRouter);
app.use("/roles", rolesRouter);
app.use("/organization-users", organizationUsersRouter);

app.use(notFound);
app.use(errorHandler);

export default app;