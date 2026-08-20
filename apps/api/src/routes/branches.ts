import { Router } from "express";

import {
  addBranch,
  editBranch,
  getBranch,
  listBranches,
  removeBranch
} from "../controllers/branchController.js";

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
  requirePermission("branches.view"),
  listBranches
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("branches.view"),
  getBranch
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("branches.manage"),
  addBranch
);

router.patch(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("branches.manage"),
  editBranch
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("branches.manage"),
  removeBranch
);

export default router;