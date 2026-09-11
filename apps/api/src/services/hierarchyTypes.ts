import type {
  OrganizationalUnitAssignmentRole
} from "../../../../packages/database/generated/client/enums.js";

export const HIERARCHY_MAX_DEPTH =
  32;

export type HierarchyActor = {
  userId: string;
  organizationId: string;
  organizationUserId: string;
};

export type HierarchyMembership = {
  id: string;
  organizationId: string;
  userId: string;
  branchId: string | null;
  departmentId: string | null;
  isAdministrator: boolean;
  permissions: Set<string>;
};

export type HierarchyCompatibilitySource =
  | "BRANCH"
  | "DEPARTMENT"
  | null;

export type CreateOrganizationalUnitTypeInput = {
  code: string;
  name: string;
  description?:
    string | null | undefined;
  displayOrder?:
    number | undefined;
  isActive?:
    boolean | undefined;
};

export type UpdateOrganizationalUnitTypeInput = {
  name?:
    string | undefined;
  description?:
    string | null | undefined;
  displayOrder?:
    number | undefined;
  isActive?:
    boolean | undefined;
};

export type CreateOrganizationalUnitInput = {
  unitTypeId: string;
  parentId?:
    string | null | undefined;
  code: string;
  name: string;
  description?:
    string | null | undefined;
  isActive?:
    boolean | undefined;
};

export type UpdateOrganizationalUnitInput = {
  unitTypeId?:
    string | undefined;
  parentId?:
    string | null | undefined;
  code?:
    string | undefined;
  name?:
    string | undefined;
  description?:
    string | null | undefined;
  isActive?:
    boolean | undefined;
};

export type CreateOrganizationalUnitAssignmentInput = {
  organizationalUnitId: string;
  organizationUserId: string;
  assignmentRole:
    OrganizationalUnitAssignmentRole;
  isPrimary?:
    boolean | undefined;
  responsibilityLabel?:
    string | null | undefined;
  effectiveStart?:
    Date | null | undefined;
  effectiveEnd?:
    Date | null | undefined;
};

export type UpdateOrganizationalUnitAssignmentInput = {
  assignmentRole?:
    OrganizationalUnitAssignmentRole | undefined;
  isPrimary?:
    boolean | undefined;
  isActive?:
    boolean | undefined;
  responsibilityLabel?:
    string | null | undefined;
  effectiveStart?:
    Date | null | undefined;
  effectiveEnd?:
    Date | null | undefined;
};

export type HierarchyListInput = {
  active?:
    boolean | undefined;
  unitTypeId?:
    string | undefined;
  parentId?:
    string | null | undefined;
  limit?:
    number | undefined;
};

export type HierarchyTraversalInput = {
  maxDepth?:
    number | undefined;
  limit?:
    number | undefined;
};

export class HierarchyServiceError
  extends Error {
  code: string;

  constructor(
    code: string,
    message: string
  ) {
    super(message);

    this.name =
      "HierarchyServiceError";

    this.code =
      code;
  }
}
