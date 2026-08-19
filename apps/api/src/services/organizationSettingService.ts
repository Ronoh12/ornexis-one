import { prisma } from "../../../../packages/database/index.js";

export type UpdateOrganizationSettingInput = {
  locale?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartsOn?: number;
  defaultLanguage?: string;
  defaultCountry?: string;
  defaultCurrency?: string;
  defaultTimezone?: string;
};

export async function getOrganizationSettings(
  organizationId: string
) {
  return prisma.organizationSetting.findUnique({
    where: {
      organizationId
    }
  });
}

export async function upsertOrganizationSettings(
  organizationId: string,
  data: UpdateOrganizationSettingInput
) {
  return prisma.organizationSetting.upsert({
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