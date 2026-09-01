import express from "express";

import healthRouter from "./routes/health.js";
import organizationsRouter from "./routes/organizations.js";
import usersRouter from "./routes/users.js";
import rolesRouter from "./routes/roles.js";
import organizationUsersRouter from "./routes/organizationUsers.js";
import permissionsRouter from "./routes/permissions.js";
import rolePermissionsRouter from "./routes/rolePermissions.js";
import authRouter from "./routes/auth.js";
import auditLogsRouter from "./routes/auditLogs.js";
import contactsRouter from "./routes/contacts.js";
import branchesRouter from "./routes/branches.js";
import departmentsRouter from "./routes/departments.js";
import dashboardRouter from "./routes/dashboard.js";
import documentsRouter from "./routes/documents.js";

import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

import workItemsRouter from "./routes/workItems.js";
import requestsRouter from "./routes/requests.js";
import workflowsRouter from "./routes/workflows.js";
import workflowInstancesRouter from "./routes/workflowInstances.js";
import notificationsRouter from "./routes/notifications.js";
import slaRouter from "./routes/sla.js";

const app = express();

app.use(express.json());

app.use("/health", healthRouter);
app.use("/organizations", organizationsRouter);
app.use("/users", usersRouter);
app.use("/roles", rolesRouter);
app.use("/organization-users", organizationUsersRouter);
app.use("/permissions", permissionsRouter);
app.use("/role-permissions", rolePermissionsRouter);
app.use("/auth", authRouter);
app.use("/audit-logs", auditLogsRouter);
app.use("/contacts", contactsRouter);
app.use("/branches", branchesRouter);
app.use("/departments", departmentsRouter);
app.use("/dashboard", dashboardRouter);
app.use("/documents", documentsRouter);

app.use("/work-items", workItemsRouter);
app.use("/requests", requestsRouter);
app.use("/workflows", workflowsRouter);
app.use("/workflow-instances", workflowInstancesRouter);
app.use("/notifications", notificationsRouter);
app.use("/sla", slaRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
