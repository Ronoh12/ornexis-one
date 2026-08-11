import { Router } from "express";

import {
  addOrganization,
  getOrganization,
  listOrganizations,
  removeOrganization
} from "../controllers/organizationController.js";

const router = Router();

router.get("/", listOrganizations);
router.get("/:id", getOrganization);
router.post("/", addOrganization);
router.delete("/:id", removeOrganization);

export default router;