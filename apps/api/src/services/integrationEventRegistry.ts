import {
  IntegrationServiceError
} from "./integrationTypes.js";

export type IntegrationEventDefinition = {
  eventType: string;
  description: string;
  payloadVersion: string;
  entityType: string;
};

const definitions = [
  {
    eventType:
      "work_item.created",
    description:
      "A Work Item was created.",
    payloadVersion:
      "1",
    entityType:
      "WORK_ITEM"
  },
  {
    eventType:
      "work_item.updated",
    description:
      "A Work Item was updated.",
    payloadVersion:
      "1",
    entityType:
      "WORK_ITEM"
  },
  {
    eventType:
      "request.created",
    description:
      "A Request was created.",
    payloadVersion:
      "1",
    entityType:
      "REQUEST"
  },
  {
    eventType:
      "request.updated",
    description:
      "A Request was updated.",
    payloadVersion:
      "1",
    entityType:
      "REQUEST"
  },
  {
    eventType:
      "document.created",
    description:
      "A Document was created.",
    payloadVersion:
      "1",
    entityType:
      "DOCUMENT"
  },
  {
    eventType:
      "organization_user.updated",
    description:
      "An organization membership was updated.",
    payloadVersion:
      "1",
    entityType:
      "ORGANIZATION_USER"
  },
  {
    eventType:
      "hierarchy.assignment.created",
    description:
      "A hierarchy assignment was created.",
    payloadVersion:
      "1",
    entityType:
      "ORGANIZATIONAL_UNIT_ASSIGNMENT"
  },
  {
    eventType:
      "audit.export.completed",
    description:
      "An authorized audit export completed.",
    payloadVersion:
      "1",
    entityType:
      "AUDIT_EXPORT"
  }
] as const satisfies
  readonly IntegrationEventDefinition[];

const definitionMap =
  new Map<
    string,
    IntegrationEventDefinition
  >(
    definitions.map(
      (definition) => [
        definition.eventType,
        definition
      ]
    )
  );

export function listIntegrationEventDefinitions() {
  return definitions.map(
    (definition) => ({
      ...definition
    })
  );
}

export function getIntegrationEventDefinition(
  eventType: string
) {
  const definition =
    definitionMap.get(
      eventType
    );

  if (!definition) {
    throw new IntegrationServiceError(
      "INTEGRATION_EVENT_UNREGISTERED",
      "The integration event type is not registered."
    );
  }

  return {
    ...definition
  };
}
