import {
  Router
} from "express";

import * as controller
  from "../controllers/integrationController.js";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  organizationContext
} from "../middleware/organizationContext.js";

import {
  requirePermission
} from "../middleware/requirePermission.js";

const router =
  Router();

router.use(
  authenticate,
  organizationContext
);

router.get(
  "/clients",
  requirePermission(
    "integrations.view"
  ),
  controller.clients
);

router.post(
  "/clients",
  requirePermission(
    "integrations.manage"
  ),
  controller.createClient
);

router.get(
  "/clients/:id/credentials",
  requirePermission(
    "integrations.credentials"
  ),
  controller.credentials
);

router.post(
  "/clients/:id/credentials",
  requirePermission(
    "integrations.manage"
  ),
  requirePermission(
    "integrations.credentials"
  ),
  controller.createCredential
);

router.get(
  "/clients/:id/scopes",
  requirePermission(
    "integrations.view"
  ),
  controller.scopes
);

router.put(
  "/clients/:id/scopes",
  requirePermission(
    "integrations.manage"
  ),
  controller.replaceScopes
);

router.post(
  "/clients/:id/suspend",
  requirePermission(
    "integrations.manage"
  ),
  controller.suspendClient
);

router.post(
  "/clients/:id/activate",
  requirePermission(
    "integrations.manage"
  ),
  controller.activateClient
);

router.post(
  "/clients/:id/revoke",
  requirePermission(
    "integrations.manage"
  ),
  controller.revokeClient
);

router.get(
  "/clients/:id",
  requirePermission(
    "integrations.view"
  ),
  controller.client
);

router.patch(
  "/clients/:id",
  requirePermission(
    "integrations.manage"
  ),
  controller.updateClient
);

router.post(
  "/credentials/:id/revoke",
  requirePermission(
    "integrations.manage"
  ),
  requirePermission(
    "integrations.credentials"
  ),
  controller.revokeCredential
);

router.get(
  "/webhook-endpoints",
  requirePermission(
    "integrations.view"
  ),
  controller.webhookEndpoints
);

router.post(
  "/webhook-endpoints",
  requirePermission(
    "integrations.webhooks"
  ),
  requirePermission(
    "integrations.credentials"
  ),
  controller.createEndpoint
);

router.get(
  "/webhook-endpoints/:id/subscriptions",
  requirePermission(
    "integrations.view"
  ),
  controller.subscriptions
);

router.put(
  "/webhook-endpoints/:id/subscriptions",
  requirePermission(
    "integrations.webhooks"
  ),
  controller.replaceSubscriptions
);

router.post(
  "/webhook-endpoints/:id/disable",
  requirePermission(
    "integrations.webhooks"
  ),
  controller.disableEndpoint
);

router.post(
  "/webhook-endpoints/:id/activate",
  requirePermission(
    "integrations.webhooks"
  ),
  controller.activateEndpoint
);

router.post(
  "/webhook-endpoints/:id/rotate-secret",
  requirePermission(
    "integrations.webhooks"
  ),
  requirePermission(
    "integrations.credentials"
  ),
  controller.rotateEndpointSecret
);

router.get(
  "/webhook-endpoints/:id",
  requirePermission(
    "integrations.view"
  ),
  controller.webhookEndpoint
);

router.patch(
  "/webhook-endpoints/:id",
  requirePermission(
    "integrations.webhooks"
  ),
  controller.updateEndpoint
);

router.get(
  "/events",
  requirePermission(
    "integrations.deliveries"
  ),
  controller.events
);

router.post(
  "/events",
  requirePermission(
    "integrations.publish"
  ),
  controller.publishEvent
);

router.get(
  "/events/:id",
  requirePermission(
    "integrations.deliveries"
  ),
  controller.event
);

router.get(
  "/deliveries",
  requirePermission(
    "integrations.deliveries"
  ),
  controller.deliveries
);

router.get(
  "/deliveries/:id/attempts",
  requirePermission(
    "integrations.deliveries"
  ),
  controller.deliveryAttempts
);

router.get(
  "/deliveries/:id",
  requirePermission(
    "integrations.deliveries"
  ),
  controller.delivery
);

export default router;
