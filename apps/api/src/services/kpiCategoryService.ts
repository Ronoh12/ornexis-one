import {
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  createAuditLog
} from "./auditService.js";

import {
  KpiServiceError,
  loadKpiMembership,
  type KpiActor
} from "./kpiScopeService.js";

export type CreateKpiCategoryInput = {
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateKpiCategoryInput = {
  name?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

function categoryCode(
  value: string
) {
  return value
    .trim()
    .toUpperCase();
}

function categoryView(
  category: {
    id: string;
    organizationId: string;
    code: string;
    name: string;
    description:
      string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
) {
  return {
    id:
      category.id,
    organizationId:
      category.organizationId,
    code:
      category.code,
    name:
      category.name,
    description:
      category.description,
    displayOrder:
      category.displayOrder,
    isActive:
      category.isActive,
    createdAt:
      category.createdAt,
    updatedAt:
      category.updatedAt
  };
}

function translateCategoryError(
  error: unknown
): never {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new KpiServiceError(
      "KPI_CATEGORY_CODE_CONFLICT",
      "A KPI category with this code already exists."
    );
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    throw new KpiServiceError(
      "KPI_CATEGORY_RELATION_INVALID",
      "The KPI category relationship is invalid."
    );
  }

  throw error;
}

export async function listKpiCategories(
  actor: KpiActor,
  input?: {
    active?: boolean;
  }
) {
  await loadKpiMembership(
    actor
  );

  const categories =
    await prisma.kpiCategory.findMany({
      where: {
        organizationId:
          actor.organizationId,
        ...(input?.active !==
        undefined
          ? {
              isActive:
                input.active
            }
          : {})
      },
      orderBy: [
        {
          displayOrder: "asc"
        },
        {
          code: "asc"
        },
        {
          id: "asc"
        }
      ]
    });

  return categories.map(
    categoryView
  );
}

export async function getKpiCategory(
  actor: KpiActor,
  categoryId: string
) {
  await loadKpiMembership(
    actor
  );

  const category =
    await prisma.kpiCategory.findFirst({
      where: {
        id:
          categoryId,
        organizationId:
          actor.organizationId
      }
    });

  if (!category) {
    throw new KpiServiceError(
      "KPI_CATEGORY_NOT_FOUND",
      "KPI category was not found."
    );
  }

  return categoryView(
    category
  );
}

export async function createKpiCategory(
  actor: KpiActor,
  input: CreateKpiCategoryInput
) {
  await loadKpiMembership(
    actor
  );

  let category;

  try {
    category =
      await prisma.kpiCategory.create({
        data: {
          organizationId:
            actor.organizationId,
          code:
            categoryCode(
              input.code
            ),
          name:
            input.name.trim(),
          ...(input.description !==
          undefined
            ? {
                description:
                  input.description
              }
            : {}),
          displayOrder:
            input.displayOrder ??
            0,
          isActive:
            input.isActive ??
            true
        }
      });
  } catch (error) {
    translateCategoryError(
      error
    );
  }

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "KPI_CATEGORY_CREATED",
    entityType:
      "KPI_CATEGORY",
    entityId:
      category.id,
    newValues: {
      code:
        category.code,
      name:
        category.name,
      description:
        category.description,
      displayOrder:
        category.displayOrder,
      isActive:
        category.isActive
    }
  });

  return categoryView(
    category
  );
}

export async function updateKpiCategory(
  actor: KpiActor,
  categoryId: string,
  input: UpdateKpiCategoryInput
) {
  await loadKpiMembership(
    actor
  );

  const existing =
    await prisma.kpiCategory.findFirst({
      where: {
        id:
          categoryId,
        organizationId:
          actor.organizationId
      }
    });

  if (!existing) {
    throw new KpiServiceError(
      "KPI_CATEGORY_NOT_FOUND",
      "KPI category was not found."
    );
  }

  let category;

  try {
    category =
      await prisma.kpiCategory.update({
        where: {
          id:
            existing.id
        },
        data: {
          ...(input.name !==
          undefined
            ? {
                name:
                  input.name.trim()
              }
            : {}),
          ...(input.description !==
          undefined
            ? {
                description:
                  input.description
              }
            : {}),
          ...(input.displayOrder !==
          undefined
            ? {
                displayOrder:
                  input.displayOrder
              }
            : {}),
          ...(input.isActive !==
          undefined
            ? {
                isActive:
                  input.isActive
              }
            : {})
        }
      });
  } catch (error) {
    translateCategoryError(
      error
    );
  }

  await createAuditLog({
    organizationId:
      actor.organizationId,
    userId:
      actor.userId,
    action:
      "KPI_CATEGORY_UPDATED",
    entityType:
      "KPI_CATEGORY",
    entityId:
      category.id,
    oldValues: {
      name:
        existing.name,
      description:
        existing.description,
      displayOrder:
        existing.displayOrder,
      isActive:
        existing.isActive
    },
    newValues: {
      name:
        category.name,
      description:
        category.description,
      displayOrder:
        category.displayOrder,
      isActive:
        category.isActive
    }
  });

  return categoryView(
    category
  );
}
