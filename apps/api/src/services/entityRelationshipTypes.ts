import type {
  EntityRelationshipType,
  EntityType
} from "../../../../packages/database/generated/client/enums.js";

export type EntityRelationshipActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type EntityRelationshipMembership = {
  id: string;
  userId: string;
  organizationId: string;
  branchId: string | null;
  departmentId: string | null;
  permissions: Set<string>;
  isAdministrator: boolean;
};

export type EntityEndpoint = {
  entityType: EntityType;
  entityId: string;
};

export type EntityStructuralScope = {
  branchId: string | null;
  departmentId: string | null;
};

export type SafeEntitySummary = {
  entityType: EntityType;
  entityId: string;
  label: string;
  status: string | null;
  scope: EntityStructuralScope;
  drillDownAvailable: boolean;
};

export type AuthorizedEntity = {
  endpoint: EntityEndpoint;
  summary: SafeEntitySummary;
  requiredViewPermission: string;
  requiredManagePermission:
    string | null;
  attachmentSupported: boolean;
};

export type NormalizedRelationship = {
  source: EntityEndpoint;
  target: EntityEndpoint;
  relationshipType:
    EntityRelationshipType;
  symmetric: boolean;
  canonicalKey: string;
};

export type RelationshipDirection =
  | "ANY"
  | "OUTGOING"
  | "INCOMING";

export type CreateEntityRelationshipInput = {
  source: EntityEndpoint;
  target: EntityEndpoint;
  relationshipType:
    EntityRelationshipType;
  description?:
    string | null | undefined;
  metadata?:
    Record<
      string,
      unknown
    > | null | undefined;
};

export class EntityRelationshipServiceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);
    this.name =
      "EntityRelationshipServiceError";
    this.code =
      code;
  }
}
