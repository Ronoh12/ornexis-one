import type {
  Request,
  Response
} from "express";

import {
  createContactForOrganization,
  deleteContactForOrganization,
  getContactByIdForOrganization,
  getContactsByOrganization,
  updateContactForOrganization
} from "../services/contactService.js";

import {
  createAuditLog
} from "../services/auditService.js";

import {
  isValidContactId,
  validateContactCreate,
  validateContactFilters,
  validateContactUpdate
} from "../validators/contactValidator.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

function getAuthContext(
  req: Request
) {
  const auth =
    (req as AuthenticatedRequest).auth;

  return {
    userId:
      auth?.userId,
    organizationId:
      auth?.organizationId
  };
}

function handleStructureFailure(
  reason:
    | "INVALID_BRANCH"
    | "INVALID_DEPARTMENT"
    | "BRANCH_DEPARTMENT_MISMATCH",
  res: Response
) {
  if (
    reason ===
    "INVALID_BRANCH"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Branch does not belong to this organization"
    });
  }

  if (
    reason ===
    "INVALID_DEPARTMENT"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Department does not belong to this organization"
    });
  }

  return res.status(400).json({
    success: false,
    message:
      "Department does not belong to the selected branch"
  });
}

function auditContactValues(
  contact: {
    contactType: string;
    branchId: string | null;
    departmentId: string | null;
    firstName: string | null;
    lastName: string | null;
    organizationName: string | null;
    email: string | null;
    phone: string | null;
    secondaryPhone: string | null;
    nationalId: string | null;
    dateOfBirth: Date | null;
    address: string | null;
    city: string | null;
    countyState: string | null;
    country: string | null;
    status: string;
  }
) {
  return {
    contactType:
      contact.contactType,

    branchId:
      contact.branchId,

    departmentId:
      contact.departmentId,

    firstName:
      contact.firstName,

    lastName:
      contact.lastName,

    organizationName:
      contact.organizationName,

    email:
      contact.email,

    phone:
      contact.phone,

    secondaryPhone:
      contact.secondaryPhone,

    nationalId:
      contact.nationalId,

    dateOfBirth:
      contact.dateOfBirth,

    address:
      contact.address,

    city:
      contact.city,

    countyState:
      contact.countyState,

    country:
      contact.country,

    status:
      contact.status
  };
}

export async function listContacts(
  req: Request,
  res: Response
) {
  const {
    organizationId
  } = getAuthContext(req);

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const validation =
    validateContactFilters(
      req.query as Record<string, unknown>
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const contacts =
    await getContactsByOrganization(
      organizationId,
      validation.data
    );

  return res.json({
    success: true,
    data: contacts
  });
}

export async function getContact(
  req: Request,
  res: Response
) {
  const {
    organizationId
  } = getAuthContext(req);

  const id =
    req.params.id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !isValidContactId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid contact ID is required"
    });
  }

  const contact =
    await getContactByIdForOrganization(
      id,
      organizationId
    );

  if (!contact) {
    return res.status(404).json({
      success: false,
      message:
        "Contact not found"
    });
  }

  return res.json({
    success: true,
    data: contact
  });
}

export async function addContact(
  req: Request,
  res: Response
) {
  const {
    userId,
    organizationId
  } = getAuthContext(req);

  if (
    !userId ||
    !organizationId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  const validation =
    validateContactCreate(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const result =
    await createContactForOrganization(
      organizationId,
      validation.data
    );

  if (!result.success) {
    if (
      result.reason ===
        "INVALID_BRANCH" ||
      result.reason ===
        "INVALID_DEPARTMENT" ||
      result.reason ===
        "BRANCH_DEPARTMENT_MISMATCH"
    ) {
      return handleStructureFailure(
        result.reason,
        res
      );
    }

    return res.status(400).json({
      success: false,
      message:
        "Unable to create contact"
    });
  }

  const contact =
    result.data;

  await createAuditLog({
    organizationId,
    userId,
    action:
      "CONTACT_CREATED",
    entityType:
      "Contact",
    entityId:
      contact.id,

    newValues:
      auditContactValues(
        contact
      ),

    ...(req.ip
      ? {
          ipAddress:
            req.ip
        }
      : {}),

    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers["user-agent"]
        }
      : {})
  });

  return res.status(201).json({
    success: true,
    message:
      "Contact created successfully",
    data:
      contact
  });
}

export async function updateContact(
  req: Request,
  res: Response
) {
  const {
    userId,
    organizationId
  } = getAuthContext(req);

  const id =
    req.params.id;

  if (
    !userId ||
    !organizationId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !isValidContactId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid contact ID is required"
    });
  }

  const validation =
    validateContactUpdate(
      req.body
    );

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message:
        validation.message
    });
  }

  const result =
    await updateContactForOrganization(
      id,
      organizationId,
      validation.data
    );

  if (!result.success) {
    if (
      result.reason ===
      "NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Contact not found"
      });
    }

    if (
      result.reason ===
      "IDENTITY_REQUIRED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A contact must have a person name or organization name"
      });
    }

    if (
      result.reason ===
        "INVALID_BRANCH" ||
      result.reason ===
        "INVALID_DEPARTMENT" ||
      result.reason ===
        "BRANCH_DEPARTMENT_MISMATCH"
    ) {
      return handleStructureFailure(
        result.reason,
        res
      );
    }

    return res.status(400).json({
      success: false,
      message:
        "Unable to update contact"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "CONTACT_UPDATED",
    entityType:
      "Contact",
    entityId:
      result.data.id,

    oldValues:
      auditContactValues(
        result.oldValues
      ),

    newValues:
      auditContactValues(
        result.data
      ),

    ...(req.ip
      ? {
          ipAddress:
            req.ip
        }
      : {}),

    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers["user-agent"]
        }
      : {})
  });

  return res.json({
    success: true,
    message:
      "Contact updated successfully",
    data:
      result.data
  });
}

export async function removeContact(
  req: Request,
  res: Response
) {
  const {
    userId,
    organizationId
  } = getAuthContext(req);

  const id =
    req.params.id;

  if (
    !userId ||
    !organizationId
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Organization context is required"
    });
  }

  if (
    typeof id !== "string" ||
    !isValidContactId(id)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A valid contact ID is required"
    });
  }

  const result =
    await deleteContactForOrganization(
      id,
      organizationId
    );

  if (!result.success) {
    return res.status(404).json({
      success: false,
      message:
        "Contact not found"
    });
  }

  await createAuditLog({
    organizationId,
    userId,
    action:
      "CONTACT_DELETED",
    entityType:
      "Contact",
    entityId:
      result.data.id,

    oldValues:
      auditContactValues(
        result.data
      ),

    ...(req.ip
      ? {
          ipAddress:
            req.ip
        }
      : {}),

    ...(req.headers["user-agent"]
      ? {
          userAgent:
            req.headers["user-agent"]
        }
      : {})
  });

  return res.json({
    success: true,
    message:
      "Contact deleted successfully",
    data:
      result.data
  });
}