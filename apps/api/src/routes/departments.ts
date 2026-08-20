import { Router } from "express";

import {
  addDepartment,
  editDepartment,
  getDepartment,
  listDepartments,
  removeDepartment
} from "../controllers/departmentController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("departments.view"),
  listDepartments
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("departments.view"),
  getDepartment
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("departments.manage"),
  addDepartment
);

router.patch(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("departments.manage"),
  editDepartment
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("departments.manage"),
  removeDepartment
);

export default router;