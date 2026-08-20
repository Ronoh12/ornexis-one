import { prisma } from "../../../../packages/database/index.js";

import type {
  CreateDepartmentInput,
  UpdateDepartmentInput
} from "../validators/departmentValidator.js";

const departmentInclude = {
  branch: true
} as const;

async function validBranch(
  organizationId: string,
  branchId: string
) {
  return prisma.branch.findFirst({
    where: {
      id: branchId,
      organizationId
    }
  });
}

async function departmentDuplicateExists(
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
    await prisma.department.findFirst({
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

export async function getDepartments(
  organizationId: string
) {
  return prisma.department.findMany({
    where: {
      organizationId
    },
    include:
      departmentInclude,
    orderBy: {
      name: "asc"
    }
  });
}

export async function getDepartmentById(
  id: string,
  organizationId: string
) {
  return prisma.department.findFirst({
    where: {
      id,
      organizationId
    },
    include:
      departmentInclude
  });
}

export async function createDepartment(
  organizationId: string,
  data: CreateDepartmentInput
) {
  if (
    data.branchId
  ) {
    const branch =
      await validBranch(
        organizationId,
        data.branchId
      );

    if (!branch) {
      return {
        success: false as const,
        reason:
          "INVALID_BRANCH" as const
      };
    }
  }

  if (
    await departmentDuplicateExists(
      organizationId,
      data
    )
  ) {
    return {
      success: false as const,
      reason: "DUPLICATE" as const
    };
  }

  const department =
    await prisma.department.create({
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
        ...(data.branchId !== undefined
          ? {
              branchId:
                data.branchId
            }
          : {}),
        ...(data.isActive !== undefined
          ? {
              isActive:
                data.isActive
            }
          : {})
      },
      include:
        departmentInclude
    });

  return {
    success: true as const,
    data: department
  };
}

export async function updateDepartment(
  id: string,
  organizationId: string,
  data: UpdateDepartmentInput
) {
  const existing =
    await prisma.department.findFirst({
      where: {
        id,
        organizationId
      },
      include:
        departmentInclude
    });

  if (!existing) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  if (
    data.branchId !== undefined &&
    data.branchId !== null
  ) {
    const branch =
      await validBranch(
        organizationId,
        data.branchId
      );

    if (!branch) {
      return {
        success: false as const,
        reason:
          "INVALID_BRANCH" as const
      };
    }
  }

  if (
    await departmentDuplicateExists(
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

  const department =
    await prisma.department.update({
      where: {
        id
      },
      data,
      include:
        departmentInclude
    });

  return {
    success: true as const,
    data: department,
    oldValues: existing
  };
}

export async function deleteDepartment(
  id: string,
  organizationId: string
) {
  const existing =
    await prisma.department.findFirst({
      where: {
        id,
        organizationId
      },
      include:
        departmentInclude
    });

  if (!existing) {
    return {
      success: false as const,
      reason: "NOT_FOUND" as const
    };
  }

  await prisma.department.delete({
    where: {
      id
    }
  });

  return {
    success: true as const,
    data: existing
  };
}