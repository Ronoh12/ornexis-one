import { prisma } from "../../../../packages/database/index.js";

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  organizationType: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  country: string;
  currency: string;
  timezone: string;
  plan?: string;
};

export type UpdateOrganizationInput = {
  name?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  currency?: string;
  timezone?: string;
};

export async function getOrganizations() {
  return prisma.organization.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: {
      id
    }
  });
}

export async function createOrganization(
  data: CreateOrganizationInput
) {
  return prisma.organization.create({
    data
  });
}

export async function deleteOrganizationById(id: string) {
  return prisma.organization.delete({
    where: {
      id
    }
  });
}

export async function getOrganizationForTenant(
  organizationId: string
) {
  return prisma.organization.findUnique({
    where: {
      id: organizationId
    }
  });
}

export async function updateOrganizationForTenant(
  organizationId: string,
  data: UpdateOrganizationInput
) {
  return prisma.organization.update({
    where: {
      id: organizationId
    },
    data
  });
}