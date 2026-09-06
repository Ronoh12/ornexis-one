import {
  EntityType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  EntityRelationshipServiceError,
  type AuthorizedEntity,
  type EntityEndpoint,
  type EntityRelationshipActor,
  type EntityRelationshipMembership,
  type EntityStructuralScope
} from "./entityRelationshipTypes.js";

type EntityAccessMode =
  | "VIEW"
  | "MANAGE"
  | "ATTACH";

type EntityRecord = {
  id: string;
  label: string;
  status: string | null;
  branchId: string | null;
  departmentId: string | null;
};

const permissionMap:
  Record<
    EntityType,
    {
      view: string;
      manage: string | null;
      attachmentSupported:
        boolean;
    }
  > = {
    [EntityType.ORGANIZATION]: {
      view:
        "organizations.view",
      manage:
        "organizations.update",
      attachmentSupported:
        false
    },
    [EntityType.BRANCH]: {
      view:
        "branches.view",
      manage:
        "branches.manage",
      attachmentSupported:
        false
    },
    [EntityType.DEPARTMENT]: {
      view:
        "departments.view",
      manage:
        "departments.manage",
      attachmentSupported:
        false
    },
    [EntityType.ORGANIZATION_USER]: {
      view:
        "organization_users.view",
      manage:
        "organization_users.manage",
      attachmentSupported:
        false
    },
    [EntityType.CONTACT]: {
      view:
        "contacts.view",
      manage:
        "contacts.update",
      attachmentSupported:
        true
    },
    [EntityType.DOCUMENT]: {
      view:
        "documents.view",
      manage:
        "documents.update",
      attachmentSupported:
        false
    },
    [EntityType.WORK_ITEM]: {
      view:
        "work_items.view",
      manage:
        "work_items.update",
      attachmentSupported:
        true
    },
    [EntityType.REQUEST]: {
      view:
        "requests.view",
      manage:
        "requests.update",
      attachmentSupported:
        true
    },
    [EntityType.WORKFLOW_DEFINITION]: {
      view:
        "workflow.view",
      manage:
        "workflow.manage_definitions",
      attachmentSupported:
        false
    },
    [EntityType.WORKFLOW_INSTANCE]: {
      view:
        "workflow.view",
      manage:
        null,
      attachmentSupported:
        false
    }
  };

export async function loadEntityRelationshipMembership(
  actor:
    EntityRelationshipActor
): Promise<
  EntityRelationshipMembership
> {
  const membership =
    await prisma.organizationUser
      .findFirst({
        where: {
          id:
            actor.organizationUserId,
          userId:
            actor.userId,
          organizationId:
            actor.organizationId,
          status:
            "ACTIVE"
        },
        select: {
          id: true,
          userId: true,
          organizationId: true,
          branchId: true,
          departmentId: true,
          role: {
            select: {
              name: true,
              isSystemRole: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: {
                      code: true
                    }
                  }
                }
              }
            }
          }
        }
      });

  if (!membership) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_MEMBERSHIP_INVALID",
      "Active organization membership is required."
    );
  }

  return {
    id:
      membership.id,
    userId:
      membership.userId,
    organizationId:
      membership.organizationId,
    branchId:
      membership.branchId,
    departmentId:
      membership.departmentId,
    permissions:
      new Set(
        membership.role
          .rolePermissions
          .map(
            (assignment) =>
              assignment.permission.code
          )
      ),
    isAdministrator:
      membership.role.name ===
        "Administrator" &&
      membership.role.isSystemRole
  };
}

export function membershipHasPermission(
  membership:
    EntityRelationshipMembership,
  permissionCode: string
) {
  return membership.permissions.has(
    permissionCode
  );
}

function requirePermission(
  membership:
    EntityRelationshipMembership,
  permissionCode: string
) {
  if (
    !membershipHasPermission(
      membership,
      permissionCode
    )
  ) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_ENTITY_FORBIDDEN",
      "The related entity is not available."
    );
  }
}

function assertStructuralAccess(
  membership:
    EntityRelationshipMembership,
  scope: EntityStructuralScope
) {
  if (membership.isAdministrator) {
    return;
  }

  if (membership.departmentId) {
    if (
      scope.departmentId !==
        membership.departmentId
    ) {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_ENTITY_FORBIDDEN",
        "The related entity is not available."
      );
    }

    return;
  }

  if (membership.branchId) {
    if (
      scope.branchId !==
        membership.branchId
    ) {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_ENTITY_FORBIDDEN",
        "The related entity is not available."
      );
    }

    return;
  }

  throw new EntityRelationshipServiceError(
    "RELATIONSHIP_SCOPE_UNASSIGNED",
    "No supported relationship scope is assigned to this membership."
  );
}

function safeLabel(
  values: Array<
    string | null | undefined
  >,
  fallback: string
) {
  const label =
    values
      .filter(
        (
          value
        ): value is string =>
          typeof value ===
            "string" &&
          value.trim().length >
            0
      )
      .join(" ")
      .trim();

  return label || fallback;
}

async function organizationRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  if (
    endpoint.entityId !==
      actor.organizationId
  ) {
    return null;
  }

  const organization =
    await prisma.organization
      .findFirst({
        where: {
          id:
            endpoint.entityId
        },
        select: {
          id: true,
          name: true,
          status: true
        }
      });

  if (!organization) {
    return null;
  }

  return {
    id:
      organization.id,
    label:
      organization.name,
    status:
      organization.status,
    branchId:
      null,
    departmentId:
      null
  };
}

async function branchRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const branch =
    await prisma.branch.findFirst({
      where: {
        id:
          endpoint.entityId,
        organizationId:
          actor.organizationId
      },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

  if (!branch) {
    return null;
  }

  return {
    id:
      branch.id,
    label:
      branch.name,
    status:
      branch.isActive
        ? "ACTIVE"
        : "INACTIVE",
    branchId:
      branch.id,
    departmentId:
      null
  };
}

async function departmentRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const department =
    await prisma.department
      .findFirst({
        where: {
          id:
            endpoint.entityId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          name: true,
          branchId: true,
          isActive: true
        }
      });

  if (!department) {
    return null;
  }

  return {
    id:
      department.id,
    label:
      department.name,
    status:
      department.isActive
        ? "ACTIVE"
        : "INACTIVE",
    branchId:
      department.branchId,
    departmentId:
      department.id
  };
}

async function organizationUserRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const membership =
    await prisma.organizationUser
      .findFirst({
        where: {
          id:
            endpoint.entityId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          status: true,
          branchId: true,
          departmentId: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

  if (!membership) {
    return null;
  }

  return {
    id:
      membership.id,
    label:
      safeLabel(
        [
          membership.user.firstName,
          membership.user.lastName
        ],
        "Organization member"
      ),
    status:
      membership.status,
    branchId:
      membership.branchId,
    departmentId:
      membership.departmentId
  };
}

async function contactRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const contact =
    await prisma.contact.findFirst({
      where: {
        id:
          endpoint.entityId,
        organizationId:
          actor.organizationId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationName: true,
        status: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!contact) {
    return null;
  }

  return {
    id:
      contact.id,
    label:
      safeLabel(
        [
          contact.organizationName,
          contact.firstName,
          contact.lastName
        ],
        "Contact"
      ),
    status:
      contact.status,
    branchId:
      contact.branchId,
    departmentId:
      contact.departmentId
  };
}

async function documentRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const document =
    await prisma.document.findFirst({
      where: {
        id:
          endpoint.entityId,
        organizationId:
          actor.organizationId
      },
      select: {
        id: true,
        title: true,
        status: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!document) {
    return null;
  }

  return {
    id:
      document.id,
    label:
      document.title,
    status:
      document.status,
    branchId:
      document.branchId,
    departmentId:
      document.departmentId
  };
}

async function workItemRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const workItem =
    await prisma.workItem.findFirst({
      where: {
        id:
          endpoint.entityId,
        organizationId:
          actor.organizationId
      },
      select: {
        id: true,
        title: true,
        status: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!workItem) {
    return null;
  }

  return {
    id:
      workItem.id,
    label:
      workItem.title,
    status:
      workItem.status,
    branchId:
      workItem.branchId,
    departmentId:
      workItem.departmentId
  };
}

async function requestRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const request =
    await prisma.request.findFirst({
      where: {
        id:
          endpoint.entityId,
        organizationId:
          actor.organizationId
      },
      select: {
        id: true,
        title: true,
        status: true,
        branchId: true,
        departmentId: true
      }
    });

  if (!request) {
    return null;
  }

  return {
    id:
      request.id,
    label:
      request.title,
    status:
      request.status,
    branchId:
      request.branchId,
    departmentId:
      request.departmentId
  };
}

async function workflowDefinitionRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const definition =
    await prisma.workflowDefinition
      .findFirst({
        where: {
          id:
            endpoint.entityId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          name: true,
          isActive: true
        }
      });

  if (!definition) {
    return null;
  }

  return {
    id:
      definition.id,
    label:
      definition.name,
    status:
      definition.isActive
        ? "ACTIVE"
        : "INACTIVE",
    branchId:
      null,
    departmentId:
      null
  };
}

async function workflowInstanceRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
): Promise<EntityRecord | null> {
  const instance =
    await prisma.workflowInstance
      .findFirst({
        where: {
          id:
            endpoint.entityId,
          organizationId:
            actor.organizationId
        },
        select: {
          id: true,
          status: true,
          workflowDefinition: {
            select: {
              name: true
            }
          }
        }
      });

  if (!instance) {
    return null;
  }

  return {
    id:
      instance.id,
    label:
      `${instance.workflowDefinition.name} instance`,
    status:
      instance.status,
    branchId:
      null,
    departmentId:
      null
  };
}

async function loadEntityRecord(
  actor:
    EntityRelationshipActor,
  endpoint: EntityEndpoint
) {
  switch (endpoint.entityType) {
    case EntityType.ORGANIZATION:
      return organizationRecord(
        actor,
        endpoint
      );

    case EntityType.BRANCH:
      return branchRecord(
        actor,
        endpoint
      );

    case EntityType.DEPARTMENT:
      return departmentRecord(
        actor,
        endpoint
      );

    case EntityType.ORGANIZATION_USER:
      return organizationUserRecord(
        actor,
        endpoint
      );

    case EntityType.CONTACT:
      return contactRecord(
        actor,
        endpoint
      );

    case EntityType.DOCUMENT:
      return documentRecord(
        actor,
        endpoint
      );

    case EntityType.WORK_ITEM:
      return workItemRecord(
        actor,
        endpoint
      );

    case EntityType.REQUEST:
      return requestRecord(
        actor,
        endpoint
      );

    case EntityType.WORKFLOW_DEFINITION:
      return workflowDefinitionRecord(
        actor,
        endpoint
      );

    case EntityType.WORKFLOW_INSTANCE:
      return workflowInstanceRecord(
        actor,
        endpoint
      );
  }
}

function attachmentManagePermission(
  entityType: EntityType
): string {
  switch (entityType) {
    case EntityType.WORK_ITEM:
      return "work_items.attach";

    case EntityType.CONTACT:
      return "contacts.update";

    case EntityType.REQUEST:
      return "requests.update";

    default:
      throw new EntityRelationshipServiceError(
        "ATTACHMENT_ENTITY_UNSUPPORTED",
        "Attachments are not supported for this entity type."
      );
  }
}

export async function authorizeEntity(
  actor:
    EntityRelationshipActor,
  membership:
    EntityRelationshipMembership,
  endpoint: EntityEndpoint,
  mode:
    EntityAccessMode = "VIEW"
): Promise<AuthorizedEntity> {
  const configuration =
    permissionMap[
      endpoint.entityType
    ];

  requirePermission(
    membership,
    configuration.view
  );

  if (
    mode ===
      "MANAGE" &&
    configuration.manage
  ) {
    requirePermission(
      membership,
      configuration.manage
    );
  }

  if (
    mode ===
      "ATTACH"
  ) {
    if (
      !configuration
        .attachmentSupported
    ) {
      throw new EntityRelationshipServiceError(
        "ATTACHMENT_ENTITY_UNSUPPORTED",
        "Attachments are not supported for this entity type."
      );
    }

    requirePermission(
      membership,
      attachmentManagePermission(
        endpoint.entityType
      )
    );
  }

  const record =
    await loadEntityRecord(
      actor,
      endpoint
    );

  if (!record) {
    throw new EntityRelationshipServiceError(
      "RELATIONSHIP_ENTITY_NOT_FOUND",
      "The related entity was not found."
    );
  }

  const scope = {
    branchId:
      record.branchId,
    departmentId:
      record.departmentId
  };

  if (
    endpoint.entityType ===
      EntityType.ORGANIZATION ||
    endpoint.entityType ===
      EntityType.WORKFLOW_DEFINITION ||
    endpoint.entityType ===
      EntityType.WORKFLOW_INSTANCE
  ) {
    if (!membership.isAdministrator) {
      throw new EntityRelationshipServiceError(
        "RELATIONSHIP_ENTITY_FORBIDDEN",
        "The related entity is not available."
      );
    }
  } else {
    assertStructuralAccess(
      membership,
      scope
    );
  }

  return {
    endpoint: {
      entityType:
        endpoint.entityType,
      entityId:
        record.id
    },
    summary: {
      entityType:
        endpoint.entityType,
      entityId:
        record.id,
      label:
        record.label,
      status:
        record.status,
      scope,
      drillDownAvailable:
        true
    },
    requiredViewPermission:
      configuration.view,
    requiredManagePermission:
      configuration.manage,
    attachmentSupported:
      configuration
        .attachmentSupported
  };
}

export async function authorizeRelationshipEndpoints(
  actor:
    EntityRelationshipActor,
  membership:
    EntityRelationshipMembership,
  source: EntityEndpoint,
  target: EntityEndpoint,
  mode:
    EntityAccessMode
) {
  const [
    authorizedSource,
    authorizedTarget
  ] =
    await Promise.all([
      authorizeEntity(
        actor,
        membership,
        source,
        mode
      ),
      authorizeEntity(
        actor,
        membership,
        target,
        mode
      )
    ]);

  return {
    source:
      authorizedSource,
    target:
      authorizedTarget
  };
}

export function attachmentEntityType(
  entityType: EntityType
) {
  switch (entityType) {
    case EntityType.WORK_ITEM:
      return "WORK_ITEM" as const;

    case EntityType.CONTACT:
      return "CONTACT" as const;

    case EntityType.REQUEST:
      return "REQUEST" as const;

    default:
      throw new EntityRelationshipServiceError(
        "ATTACHMENT_ENTITY_UNSUPPORTED",
        "This entity type does not support document attachments."
      );
  }
}
