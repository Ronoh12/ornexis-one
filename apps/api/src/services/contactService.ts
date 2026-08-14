import { prisma } from "../../../../packages/database/index.js";

export async function getContactsByOrganization(
  organizationId: string
) {
  return prisma.contact.findMany({
    where: {
      organizationId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getContactByIdForOrganization(
  id: string,
  organizationId: string
) {
  return prisma.contact.findFirst({
    where: {
      id,
      organizationId
    }
  });
}

export async function createContactForOrganization(
  organizationId: string,
  data: {
    contactType:
      | "MEMBER"
      | "CUSTOMER"
      | "EMPLOYEE"
      | "SUPPLIER"
      | "VOLUNTEER"
      | "DONOR"
      | "PARTNER"
      | "OTHER";
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    email?: string;
    phone?: string;
    secondaryPhone?: string;
    nationalId?: string;
    dateOfBirth?: Date;
    address?: string;
    city?: string;
    countyState?: string;
    country?: string;
  }
) {
  return prisma.contact.create({
    data: {
      organizationId,
      ...data
    }
  });
}

export async function deleteContactForOrganization(
  id: string,
  organizationId: string
) {
  return prisma.contact.deleteMany({
    where: {
      id,
      organizationId
    }
  });
}