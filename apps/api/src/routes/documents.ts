import {
  Router
} from "express";

import {
  deleteOrganizationDocument,
  downloadOrganizationDocument,
  getOrganizationDocument,
  listOrganizationDocuments,
  updateOrganizationDocument,
  uploadDocument
} from "../controllers/documentController.js";

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
  documentUpload
} from "../middleware/documentUpload.js";

const router = Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/",
  requirePermission(
    "documents.view"
  ),
  listOrganizationDocuments
);

router.get(
  "/:id/download",
  requirePermission(
    "documents.download"
  ),
  downloadOrganizationDocument
);

router.get(
  "/:id",
  requirePermission(
    "documents.view"
  ),
  getOrganizationDocument
);

router.post(
  "/",
  requirePermission(
    "documents.upload"
  ),
  documentUpload.single("file"),
  uploadDocument
);

router.patch(
  "/:id",
  requirePermission(
    "documents.update"
  ),
  updateOrganizationDocument
);

router.delete(
  "/:id",
  requirePermission(
    "documents.delete"
  ),
  deleteOrganizationDocument
);

export default router;