import {
  Router
} from "express";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

import {
  overview
} from "../controllers/commandCentreController.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission(
    "command.view"
  ),
  overview
);

export default router;
