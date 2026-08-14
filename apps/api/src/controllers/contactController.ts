import type { Request, Response } from "express";

import {
  createContactForOrganization,
  deleteContactForOrganization,
  getContactByIdForOrganization,
  getContactsByOrganization
} from "../services/contactService.js";

import { createAuditLog } from "../services/auditService.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    organizationId?: string;
  };
};

const CONTACT_TYPES = [
  "MEMBER",
  "CUSTOMER",
  "EMPLOYEE",
  "SUPPLIER",
  "VOLUNTEER",
  "DONOR",
  "PARTNER",
  "OTHER"
] as const;

export async function listContacts(
  req: Request,
  res: Response
) {
  const auth = (req as AuthenticatedRequest).auth;

  const organizationId = auth?.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const contacts =
    await getContactsByOrganization(
      organizationId
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
  const auth = (req as AuthenticatedRequest).auth;

  const organizationId =
    auth?.organizationId;

  const id = req.params.id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid contact ID is required"
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
      message: "Contact not found"
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
  const auth = (req as AuthenticatedRequest).auth;

  const userId = auth?.userId;
  const organizationId =
    auth?.organizationId;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  const {
    contactType,
    firstName,
    lastName,
    organizationName,
    email,
    phone,
    secondaryPhone,
    nationalId,
    dateOfBirth,
    address,
    city,
    countyState,
    country
  } = req.body;

  if (
    typeof contactType !== "string" ||
    !CONTACT_TYPES.includes(
      contactType as (typeof CONTACT_TYPES)[number]
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid contact type is required"
    });
  }

  if (
    !firstName &&
    !lastName &&
    !organizationName
  ) {
    return res.status(400).json({
      success: false,
      message:
        "A contact must have a person name or organization name"
    });
  }

  let parsedDateOfBirth: Date | undefined;

  if (dateOfBirth !== undefined) {
    const date = new Date(dateOfBirth);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth"
      });
    }

    parsedDateOfBirth = date;
  }

  const contact =
    await createContactForOrganization(
      organizationId,
      {
        contactType:
          contactType as (typeof CONTACT_TYPES)[number],

        ...(typeof firstName === "string"
          ? { firstName }
          : {}),

        ...(typeof lastName === "string"
          ? { lastName }
          : {}),

        ...(typeof organizationName === "string"
          ? { organizationName }
          : {}),

        ...(typeof email === "string"
          ? { email }
          : {}),

        ...(typeof phone === "string"
          ? { phone }
          : {}),

        ...(typeof secondaryPhone === "string"
          ? { secondaryPhone }
          : {}),

        ...(typeof nationalId === "string"
          ? { nationalId }
          : {}),

        ...(parsedDateOfBirth
          ? { dateOfBirth: parsedDateOfBirth }
          : {}),

        ...(typeof address === "string"
          ? { address }
          : {}),

        ...(typeof city === "string"
          ? { city }
          : {}),

        ...(typeof countyState === "string"
          ? { countyState }
          : {}),

        ...(typeof country === "string"
          ? { country }
          : {})
      }
    );

  await createAuditLog({
    organizationId,
    userId,
    action: "CONTACT_CREATED",
    entityType: "Contact",
    entityId: contact.id,

    newValues: {
      contactType: contact.contactType,
      firstName: contact.firstName,
      lastName: contact.lastName,
      organizationName:
        contact.organizationName,
      email: contact.email,
      phone: contact.phone,
      status: contact.status
    },

    ...(req.ip
      ? { ipAddress: req.ip }
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
    message: "Contact created successfully",
    data: contact
  });
}

export async function removeContact(
  req: Request,
  res: Response
) {
  const auth = (req as AuthenticatedRequest).auth;

  const userId = auth?.userId;
  const organizationId =
    auth?.organizationId;

  const id = req.params.id;

  if (!userId || !organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization context is required"
    });
  }

  if (typeof id !== "string" || !id) {
    return res.status(400).json({
      success: false,
      message: "A valid contact ID is required"
    });
  }

  const existingContact =
    await getContactByIdForOrganization(
      id,
      organizationId
    );

  if (!existingContact) {
    return res.status(404).json({
      success: false,
      message: "Contact not found"
    });
  }

  await deleteContactForOrganization(
    id,
    organizationId
  );

  await createAuditLog({
    organizationId,
    userId,
    action: "CONTACT_DELETED",
    entityType: "Contact",
    entityId: existingContact.id,

    oldValues: {
      contactType:
        existingContact.contactType,
      firstName:
        existingContact.firstName,
      lastName:
        existingContact.lastName,
      organizationName:
        existingContact.organizationName,
      email:
        existingContact.email,
      phone:
        existingContact.phone,
      status:
        existingContact.status
    },

    ...(req.ip
      ? { ipAddress: req.ip }
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
    message: "Contact deleted successfully"
  });
}