import { Router } from "express";

import {
  addContact,
  attachContactDocument,
  detachContactDocument,
  getContact,
  listContactAttachments,
  listContacts,
  removeContact,
  updateContact
} from "../controllers/contactController.js";

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
  requirePermission("contacts.view"),
  listContacts
);

router.get(
  "/:id/attachments",
  authenticate,
  organizationContext,
  requirePermission("contacts.view"),
  listContactAttachments
);

router.post(
  "/:id/attachments",
  authenticate,
  organizationContext,
  requirePermission("contacts.update"),
  attachContactDocument
);

router.delete(
  "/:id/attachments/:attachmentId",
  authenticate,
  organizationContext,
  requirePermission("contacts.update"),
  detachContactDocument
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

router.patch(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("contacts.update"),
  updateContact
);

router.delete(
  "/:id",
  authenticate,
  organizationContext,
  requirePermission("contacts.delete"),
  removeContact
);

export default router;