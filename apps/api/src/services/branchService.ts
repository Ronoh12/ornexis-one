import { prisma } from "../../../../packages/database/index.js";

import type {
  CreateBranchInput,
  UpdateBranchInput
} from "../validators/branchValidator.js";

export async function getBranches(
  organizationId: string
) {
  return prisma.branch.findMany({
    where: {
      organizationId
    },
    include: {
      _count: {
        select: {
          departments: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}

export async function getBranchById(
  id: string,
  organizationId: string
) {
  return prisma.branch.findFirst({
    where: {
      id,
      organizationId
    },
    include: {
      departments: {
        orderBy: {
          name: "asc"
        }
      }
    }
  });
}

async function branchDuplicateExists(
  organizationId: string,
  data: {
    name?: string;
    code?: string | null;
  },
  excludeId?: string
) {
  const conditions: any[] = [];

  if (data.name !== undefined) {
    conditions.push({
      name: data.name
    });
  }

  if (
    data.code !== undefined &&
    data.code !== null
  ) {
    conditions.push({
      code: data.code
    });
  }

  if (conditions.length === 0) {
    return false;
  }

  const duplicate =
    await prisma.branch.findFirst({
      where: {
        organizationId,
        OR: conditions,
        ...(excludeId
          ? {
              id: {
                not: excludeId
              }
            }
          : {})
      }
    });

  return Boolean(duplicate);
}

export async function createBranch(
  organizationId: string,
  data: CreateBranchInput
) {
  if (
    await branchDuplicateExists(
      organizationId,
      data
    )
  ) {
    return {
      success: false as const,
      reason: "DUPLICATE" as const
    };
  }

  const branch =
    await prisma.branch.create({
      data: {
        organizationId,
        name: data.name,
        ...(data.code !== undefined
          ? {
              code: data.code
            }
          : {}),
        ...(data.description !== undefined
          ? {
              description:
                data.description
            }
          : {}),
        ...(data.email !== undefined
          ? {
              email: data.email
            }
          : {}),
        ...(data.phone !== undefined
          ? {
              phone: data.phone
            }
          : {}),
        ...(data.address !== undefined
          ? {
              address: data.address
            }
          : {}),
        ...(data.city !== undefined
          ? {
              city: data.city
            }
          : {}),
        ...(data.countyState !== undefined
          ? {
              countyState:
                data.countyState
            }
          : {}),
        ...(data.country !== undefined
          ? {
              country: data.country
            }
          : {}),
        ...(data.isActive !== undefined
          ? {
              isActive:
                data.isActive
            }
          : {})
      }
    });

  return {
    success: true as const,
    data: branch
  };
}

export async function updateBranch(
  id: string,
  organizationId: string,
  data: UpdateBranchInput
) {
  const existing =
    await prisma.branch.findFirst({
      where: {
        id,
        organizationId
      }
    });

  if (!existing) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (
    await branchDuplicateExists(
      organizationId,
      data,
      id
    )
  ) {
    return {
      success: false as const,
      reason: "DUPLICATE" as const
    };
  }

  const branch =
    await prisma.branch.update({
      where: {
        id
      },
      data
    });

  return {
    success: true as const,
    data: branch,
    oldValues: existing
  };
}

export async function deleteBranch(
  id: string,
  organizationId: string
) {
  const existing =
    await prisma.branch.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        departments: {
          select: {
            id: true
          }
        }
      }
    });

  if (!existing) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (existing.departments.length > 0) {
    return {
      success: false as const,
      reason:
        "HAS_DEPARTMENTS" as const
    };
  }

  await prisma.branch.delete({
    where: {
      id
    }
  });

  return {
    success: true as const,
    data: existing
  };
}