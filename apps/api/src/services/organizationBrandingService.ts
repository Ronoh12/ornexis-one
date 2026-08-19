import { prisma } from "../../../../packages/database/index.js";

export type UpdateOrganizationBrandingInput = {
  displayName?: string;
  shortName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
};

export async function getOrganizationBranding(
  organizationId: string
) {
  return prisma.organizationBranding.findUnique({
    where: {
      organizationId
    }
  });
}

export async function upsertOrganizationBranding(
  organizationId: string,
  data: UpdateOrganizationBrandingInput
) {
  return prisma.organizationBranding.upsert({
    where: {
      organizationId
    },
    create: {
      organizationId,
      ...data
    },
    update: data
  });
}