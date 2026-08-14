import { Router } from "express";

import {
  addContact,
  getContact,
  listContacts,
  removeContact
} from "../controllers/contactController.js";

import { authenticate } from "../middleware/authenticate.js";
import { organizationContext } from "../middleware/organizationContext.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.get(
  "/",
  authenticate,
  organizationContext,
  requirePermission("contacts.view"),
  listContacts
);

router.get(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("contacts.view"),
  getContact
);

router.post(
  "/",
  authenticate,
  organizationContext,
  requirePermission("contacts.create"),
  addContact
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("contacts.delete"),
  removeContact
);

export default router;