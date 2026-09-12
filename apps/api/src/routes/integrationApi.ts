import {
  Router
} from "express";

import {
  me
} from "../controllers/integrationApiController.js";

import {
  authenticateIntegration
} from "../middleware/authenticateIntegration.js";

const router =
  Router();

router.use(
  authenticateIntegration
);

router.get(
  "/me",
  me
);

export default router;
