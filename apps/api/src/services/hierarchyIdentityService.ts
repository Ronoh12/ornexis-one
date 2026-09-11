import {
  HierarchyServiceError,
  HIERARCHY_MAX_DEPTH
} from "./hierarchyTypes.js";

const hierarchyCodePattern =
  /^[A-Z0-9][A-Z0-9_-]{0,63}$/;

export function normalizeHierarchyCode(
  value: string
) {
  const code =
    value
      .trim()
      .toUpperCase()
      .replace(
        /\s+/g,
        "_"
      );

  if (
    !hierarchyCodePattern.test(
      code
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_CODE_INVALID",
      "Hierarchy codes must contain only letters, numbers, underscores or hyphens and must be at most 64 characters."
    );
  }

  return code;
}

export function normalizeHierarchyName(
  value: string
) {
  const name =
    value
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  if (
    name.length === 0 ||
    name.length > 160
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_NAME_INVALID",
      "Hierarchy names must contain between 1 and 160 characters."
    );
  }

  return {
    name,
    normalizedName:
      name.toLowerCase()
  };
}

export function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
  maximumLength = 2000
) {
  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    value === null
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    normalized.length >
      maximumLength
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_TEXT_TOO_LONG",
      `Hierarchy text must not exceed ${maximumLength} characters.`
    );
  }

  return normalized ||
    null;
}

export function validateHierarchyDepth(
  value:
    number |
    undefined
) {
  const depth =
    value ??
    HIERARCHY_MAX_DEPTH;

  if (
    !Number.isInteger(depth) ||
    depth < 1 ||
    depth >
      HIERARCHY_MAX_DEPTH
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_DEPTH_INVALID",
      `Hierarchy depth must be between 1 and ${HIERARCHY_MAX_DEPTH}.`
    );
  }

  return depth;
}

export function validateHierarchyLimit(
  value:
    number |
    undefined,
  defaultLimit = 50
) {
  const limit =
    value ??
    defaultLimit;

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 200
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_LIMIT_INVALID",
      "Hierarchy list limit must be between 1 and 200."
    );
  }

  return limit;
}

export function validateEffectivePeriod(
  effectiveStart:
    Date |
    null |
    undefined,
  effectiveEnd:
    Date |
    null |
    undefined
) {
  if (
    effectiveStart &&
    Number.isNaN(
      effectiveStart.getTime()
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_EFFECTIVE_PERIOD_INVALID",
      "The effective start is invalid."
    );
  }

  if (
    effectiveEnd &&
    Number.isNaN(
      effectiveEnd.getTime()
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_EFFECTIVE_PERIOD_INVALID",
      "The effective end is invalid."
    );
  }

  if (
    effectiveStart &&
    effectiveEnd &&
    effectiveEnd <
      effectiveStart
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_EFFECTIVE_PERIOD_INVALID",
      "The effective end must not be earlier than the effective start."
    );
  }
}

export function assignmentIsEffective(
  assignment: {
    isActive: boolean;
    effectiveStart:
      Date | null;
    effectiveEnd:
      Date | null;
  },
  at =
    new Date()
) {
  if (
    !assignment.isActive
  ) {
    return false;
  }

  if (
    assignment.effectiveStart &&
    assignment.effectiveStart >
      at
  ) {
    return false;
  }

  if (
    assignment.effectiveEnd &&
    assignment.effectiveEnd <
      at
  ) {
    return false;
  }

  return true;
}

export function hierarchyCompatibilitySource(
  unit: {
    legacyBranchId:
      string | null;
    legacyDepartmentId:
      string | null;
  }
):
  | "BRANCH"
  | "DEPARTMENT"
  | null {
  if (
    unit.legacyBranchId
  ) {
    return "BRANCH";
  }

  if (
    unit.legacyDepartmentId
  ) {
    return "DEPARTMENT";
  }

  return null;
}

export function requireCustomHierarchyUnit(
  unit: {
    legacyBranchId:
      string | null;
    legacyDepartmentId:
      string | null;
  }
) {
  if (
    hierarchyCompatibilitySource(
      unit
    )
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_COMPATIBILITY_PROTECTED",
      "Compatibility units must be changed through their legacy Branch or Department API."
    );
  }
}
