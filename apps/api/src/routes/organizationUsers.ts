import { Router } from "express";

import {
  addOrganizationUser,
  getOrganizationUser,
  listOrganizationUsers
} from "../controllers/organizationUserController.js";

const router = Router();

router.get("/", listOrganizationUsers);
router.get("/:id", getOrganizationUser);
router.post("/", addOrganizationUser);

export default router;