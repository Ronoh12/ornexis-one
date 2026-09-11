import type {
  Request,
  Response
} from "express";

import {
  createOrganizationalUnitAssignment,
  deactivateOrganizationalUnitAssignment,
  listOrganizationalUnitMembers,
  listOrganizationUserUnitAssignments,
  updateOrganizationalUnitAssignment
} from "../services/organizationalUnitAssignmentService.js";

import {
  reconcileOrganizationalHierarchy
} from "../services/hierarchyCompatibilityService.js";

import {
  loadAuthorizedHierarchyMembership
} from "../services/hierarchyAuthorizationService.js";

import {
  loadHierarchyAncestors,
  loadHierarchyDescendants
} from "../services/hierarchyTraversalService.js";

import {
  HierarchyServiceError
} from "../services/hierarchyTypes.js";

import {
  createOrganizationalUnit,
  deleteOrganizationalUnit,
  getOrganizationalUnit,
  listOrganizationalUnits,
  updateOrganizationalUnit
} from "../services/organizationalUnitService.js";

import {
  createOrganizationalUnitType,
  deleteOrganizationalUnitType,
  listOrganizationalUnitTypes,
  updateOrganizationalUnitType
} from "../services/organizationalUnitTypeService.js";

import {
  HierarchyValidationError,
  parseAssignmentQuery,
  parseCreateOrganizationalUnit,
  parseCreateOrganizationalUnitAssignment,
  parseCreateOrganizationalUnitType,
  parseHierarchyId,
  parseHierarchyTraversalQuery,
  parseOrganizationalUnitQuery,
  parseOrganizationalUnitTypeQuery,
  parseUpdateOrganizationalUnit,
  parseUpdateOrganizationalUnitAssignment,
  parseUpdateOrganizationalUnitType
} from "../validators/hierarchyValidator.js";

type AuthRequest =
  Request & {
    auth?: {
      userId: string;
      organizationId: string;
      organizationUserId?:
        string;
    };
  };

function actor(
  req: AuthRequest
) {
  const auth =
    req.auth;

  if (
    !auth?.userId ||
    !auth.organizationId
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_MEMBERSHIP_REQUIRED",
      "Authentication and organization context are required."
    );
  }

  if (
    !auth.organizationUserId
  ) {
    throw new HierarchyServiceError(
      "HIERARCHY_MEMBERSHIP_REQUIRED",
      "An active organization membership is required."
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

function handleHierarchyError(
  res: Response,
  error: unknown
) {
  if (
    error instanceof
      HierarchyValidationError
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof
      HierarchyServiceError
  ) {
    const notFoundCodes =
      new Set([
        "HIERARCHY_UNIT_TYPE_NOT_FOUND",
        "HIERARCHY_UNIT_NOT_FOUND",
        "HIERARCHY_ASSIGNMENT_NOT_FOUND"
      ]);

    const conflictCodes =
      new Set([
        "HIERARCHY_UNIT_TYPE_DUPLICATE",
        "HIERARCHY_UNIT_TYPE_IN_USE",
        "HIERARCHY_UNIT_DUPLICATE",
        "HIERARCHY_CYCLE_DETECTED",
        "HIERARCHY_COMPATIBILITY_PROTECTED",
        "HIERARCHY_UNIT_IN_USE",
        "HIERARCHY_ASSIGNMENT_DUPLICATE",
        "HIERARCHY_PRIMARY_ASSIGNMENT_CONFLICT"
      ]);

    const badRequestCodes =
      new Set([
        "HIERARCHY_CODE_INVALID",
        "HIERARCHY_NAME_INVALID",
        "HIERARCHY_TEXT_TOO_LONG",
        "HIERARCHY_LIMIT_INVALID",
        "HIERARCHY_DEPTH_INVALID",
        "HIERARCHY_DEPTH_EXCEEDED",
        "HIERARCHY_PARENT_INVALID",
        "HIERARCHY_ASSIGNMENT_INVALID",
        "HIERARCHY_EFFECTIVE_PERIOD_INVALID"
      ]);

    if (
      notFoundCodes.has(
        error.code
      )
    ) {
      return res.status(404).json({
        success: false,
        code:
          error.code,
        message:
          error.message
      });
    }

    if (
      conflictCodes.has(
        error.code
      )
    ) {
      return res.status(409).json({
        success: false,
        code:
          error.code,
        message:
          error.message
      });
    }

    if (
      badRequestCodes.has(
        error.code
      )
    ) {
      return res.status(400).json({
        success: false,
        code:
          error.code,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "HIERARCHY_FORBIDDEN"
    ) {
      return res.status(403).json({
        success: false,
        code:
          error.code,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "HIERARCHY_MEMBERSHIP_REQUIRED"
    ) {
      return res.status(401).json({
        success: false,
        code:
          error.code,
        message:
          error.message
      });
    }
  }

  console.error(
    "Hierarchy request failed.",
    error
  );

  return res.status(500).json({
    success: false,
    message:
      "The hierarchy operation failed."
  });
}

export async function unitTypes(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listOrganizationalUnitTypes(
        actor(req),
        parseOrganizationalUnitTypeQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function createUnitType(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createOrganizationalUnitType(
        actor(req),
        parseCreateOrganizationalUnitType(
          req.body
        )
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function updateUnitType(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateOrganizationalUnitType(
        actor(req),
        parseHierarchyId(
          req.params.id
        ),
        parseUpdateOrganizationalUnitType(
          req.body
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function removeUnitType(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await deleteOrganizationalUnitType(
        actor(req),
        parseHierarchyId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function units(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listOrganizationalUnits(
        actor(req),
        parseOrganizationalUnitQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function createUnit(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createOrganizationalUnit(
        actor(req),
        parseCreateOrganizationalUnit(
          req.body
        )
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function unit(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getOrganizationalUnit(
        actor(req),
        parseHierarchyId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function updateUnit(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateOrganizationalUnit(
        actor(req),
        parseHierarchyId(
          req.params.id
        ),
        parseUpdateOrganizationalUnit(
          req.body
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function removeUnit(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await deleteOrganizationalUnit(
        actor(req),
        parseHierarchyId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function ancestors(
  req: AuthRequest,
  res: Response
) {
  try {
    const hierarchyActor =
      actor(req);

    const membership =
      await loadAuthorizedHierarchyMembership(
        hierarchyActor,
        "hierarchy.view"
      );

    const data =
      await loadHierarchyAncestors(
        hierarchyActor,
        membership,
        parseHierarchyId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function descendants(
  req: AuthRequest,
  res: Response
) {
  try {
    const hierarchyActor =
      actor(req);

    const membership =
      await loadAuthorizedHierarchyMembership(
        hierarchyActor,
        "hierarchy.view"
      );

    const data =
      await loadHierarchyDescendants(
        hierarchyActor,
        membership,
        parseHierarchyId(
          req.params.id
        ),
        parseHierarchyTraversalQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function members(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listOrganizationalUnitMembers(
        actor(req),
        parseHierarchyId(
          req.params.id
        ),
        parseAssignmentQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function createAssignment(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createOrganizationalUnitAssignment(
        actor(req),
        parseCreateOrganizationalUnitAssignment(
          req.body
        )
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function updateAssignment(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateOrganizationalUnitAssignment(
        actor(req),
        parseHierarchyId(
          req.params.id
        ),
        parseUpdateOrganizationalUnitAssignment(
          req.body
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function removeAssignment(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await deactivateOrganizationalUnitAssignment(
        actor(req),
        parseHierarchyId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function memberships(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listOrganizationUserUnitAssignments(
        actor(req),
        parseHierarchyId(
          req.params.organizationUserId,
          "organizationUserId"
        ),
        parseAssignmentQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}

export async function reconcile(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await reconcileOrganizationalHierarchy(
        actor(req)
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleHierarchyError(
      res,
      error
    );
  }
}
