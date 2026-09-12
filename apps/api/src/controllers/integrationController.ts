import type {
  Request,
  Response
} from "express";

import {
  activateIntegrationClient,
  createIntegrationClient,
  createIntegrationCredential,
  getIntegrationClient,
  listIntegrationClients,
  listIntegrationCredentials,
  listIntegrationScopes,
  replaceIntegrationScopes,
  revokeIntegrationClient,
  revokeIntegrationCredential,
  suspendIntegrationClient,
  updateIntegrationClient
} from "../services/integrationClientService.js";

import {
  publishIntegrationEvent
} from "../services/integrationEventService.js";

import {
  getIntegrationEvent,
  getWebhookDelivery,
  listIntegrationEvents,
  listWebhookDeliveries,
  listWebhookDeliveryAttempts
} from "../services/integrationQueryService.js";

import {
  auditRequestContext
} from "../services/auditRequestContextService.js";

import {
  IntegrationServiceError,
  type IntegrationActor
} from "../services/integrationTypes.js";

import {
  activateWebhookEndpoint,
  createWebhookEndpoint,
  disableWebhookEndpoint,
  getWebhookEndpoint,
  listWebhookEndpoints,
  listWebhookSubscriptions,
  replaceWebhookSubscriptions,
  rotateWebhookEndpointSecret,
  updateWebhookEndpoint
} from "../services/webhookConfigurationService.js";

import {
  parseCreateIntegrationClient,
  parseCreateIntegrationCredential,
  parseCreateWebhookEndpoint,
  parseIntegrationClientQuery,
  parseIntegrationEventQuery,
  parseIntegrationId,
  parsePublishIntegrationEvent,
  parseReplaceIntegrationScopes,
  parseReplaceWebhookSubscriptions,
  parseUpdateIntegrationClient,
  parseUpdateWebhookEndpoint,
  parseWebhookDeliveryQuery,
  parseWebhookEndpointQuery
} from "../validators/integrationValidator.js";

type AuthRequest =
  Request & {
    auth?: {
      userId: string;
      organizationId:
        string;
      organizationUserId:
        string;
    };
  };

function actor(
  req:
    AuthRequest
):
  IntegrationActor {
  const auth =
    req.auth;

  if (
    !auth?.userId ||
    !auth.organizationId ||
    !auth.organizationUserId
  ) {
    throw new IntegrationServiceError(
      "INTEGRATION_UNAUTHENTICATED",
      "Authentication and organization context are required."
    );
  }

  return {
    userId:
      auth.userId,
    organizationId:
      auth.organizationId,
    organizationUserId:
      auth.organizationUserId
  };
}

function statusForError(
  error:
    IntegrationServiceError
) {
  if (
    error.code ===
      "INTEGRATION_UNAUTHENTICATED"
  ) {
    return 401;
  }

  if (
    error.code ===
      "INTEGRATION_FORBIDDEN"
  ) {
    return 403;
  }

  if (
    error.code ===
      "INTEGRATION_NOT_FOUND"
  ) {
    return 404;
  }

  if (
    error.code ===
      "INTEGRATION_DUPLICATE" ||
    error.code ===
      "INTEGRATION_CONFLICT" ||
    error.code ===
      "INTEGRATION_STATE_CONFLICT" ||
    error.code ===
      "INTEGRATION_IDEMPOTENCY_CONFLICT" ||
    error.code ===
      "INTEGRATION_DELIVERY_CONFLICT"
  ) {
    return 409;
  }

  if (
    error.code ===
      "INTEGRATION_SECRET_UNAVAILABLE"
  ) {
    return 503;
  }

  return 400;
}

async function execute(
  res:
    Response,
  operation:
    () =>
      Promise<unknown>,
  successStatus =
    200
) {
  try {
    const data =
      await operation();

    return res.status(
      successStatus
    ).json({
      success:
        true,
      data
    });
  } catch (
    error
  ) {
    if (
      error instanceof
        IntegrationServiceError
    ) {
      return res.status(
        statusForError(
          error
        )
      ).json({
        success:
          false,
        message:
          error.message,
        code:
          error.code
      });
    }

    console.error(
      "Integration request failed.",
      error
    );

    return res.status(
      500
    ).json({
      success:
        false,
      message:
        "Internal server error"
    });
  }
}

export async function clients(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listIntegrationClients(
        actor(
          req
        ),
        parseIntegrationClientQuery(
          req.query
        )
      )
  );
}

export async function client(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      getIntegrationClient(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function createClient(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      createIntegrationClient(
        actor(
          req
        ),
        parseCreateIntegrationClient(
          req.body
        ),
        auditRequestContext(
          req
        )
      ),
    201
  );
}

export async function updateClient(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      updateIntegrationClient(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        parseUpdateIntegrationClient(
          req.body
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function suspendClient(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      suspendIntegrationClient(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function activateClient(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      activateIntegrationClient(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function revokeClient(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      revokeIntegrationClient(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function credentials(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listIntegrationCredentials(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function createCredential(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      createIntegrationCredential(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        parseCreateIntegrationCredential(
          req.body
        ),
        auditRequestContext(
          req
        )
      ),
    201
  );
}

export async function revokeCredential(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      revokeIntegrationCredential(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function scopes(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listIntegrationScopes(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function replaceScopes(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      replaceIntegrationScopes(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        parseReplaceIntegrationScopes(
          req.body
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function webhookEndpoints(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listWebhookEndpoints(
        actor(
          req
        ),
        parseWebhookEndpointQuery(
          req.query
        )
      )
  );
}

export async function webhookEndpoint(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      getWebhookEndpoint(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function createEndpoint(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      createWebhookEndpoint(
        actor(
          req
        ),
        parseCreateWebhookEndpoint(
          req.body
        ),
        auditRequestContext(
          req
        )
      ),
    201
  );
}

export async function updateEndpoint(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      updateWebhookEndpoint(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        parseUpdateWebhookEndpoint(
          req.body
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function disableEndpoint(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      disableWebhookEndpoint(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function activateEndpoint(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      activateWebhookEndpoint(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function rotateEndpointSecret(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      rotateWebhookEndpointSecret(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function subscriptions(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listWebhookSubscriptions(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function replaceSubscriptions(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      replaceWebhookSubscriptions(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        ),
        parseReplaceWebhookSubscriptions(
          req.body
        ),
        auditRequestContext(
          req
        )
      )
  );
}

export async function publishEvent(
  req:
    AuthRequest,
  res:
    Response
) {
  try {
    const data =
      await publishIntegrationEvent(
        actor(
          req
        ),
        parsePublishIntegrationEvent(
          req.body
        ),
        auditRequestContext(
          req
        )
      );

    return res.status(
      data.idempotent
        ? 200
        : 201
    ).json({
      success:
        true,
      data
    });
  } catch (
    error
  ) {
    if (
      error instanceof
        IntegrationServiceError
    ) {
      return res.status(
        statusForError(
          error
        )
      ).json({
        success:
          false,
        message:
          error.message,
        code:
          error.code
      });
    }

    console.error(
      "Integration event publication failed.",
      error
    );

    return res.status(
      500
    ).json({
      success:
        false,
      message:
        "Internal server error"
    });
  }
}

export async function events(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listIntegrationEvents(
        actor(
          req
        ),
        parseIntegrationEventQuery(
          req.query
        )
      )
  );
}

export async function event(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      getIntegrationEvent(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function deliveries(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listWebhookDeliveries(
        actor(
          req
        ),
        parseWebhookDeliveryQuery(
          req.query
        )
      )
  );
}

export async function delivery(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      getWebhookDelivery(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}

export async function deliveryAttempts(
  req:
    AuthRequest,
  res:
    Response
) {
  return execute(
    res,
    () =>
      listWebhookDeliveryAttempts(
        actor(
          req
        ),
        parseIntegrationId(
          req.params.id
        )
      )
  );
}
