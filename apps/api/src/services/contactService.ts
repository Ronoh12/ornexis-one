import { prisma } from "../../../../packages/database/index.js";

import type {
  ContactFilters,
  CreateContactInput,
  UpdateContactInput
} from "../validators/contactValidator.js";

const contactInclude = {
  branch: true,
  department: {
    include: {
      branch: true
    }
  }
} as const;

async function validateStructureAssignment(
  organizationId: string,
  branchId: string | null | undefined,
  departmentId: string | null | undefined
) {
  let branch = null;
  let department = null;

  if (
    branchId !== undefined &&
    branchId !== null
  ) {
    branch =
      await prisma.branch.findFirst({
        where: {
          id: branchId,
          organizationId
        }
      });

    if (!branch) {
      return {
        success: false as const,
        reason:
          "INVALID_BRANCH" as const
      };
    }
  }

  if (
    departmentId !== undefined &&
    departmentId !== null
  ) {
    department =
      await prisma.department.findFirst({
        where: {
          id: departmentId,
          organizationId
        }
      });

    if (!department) {
      return {
        success: false as const,
        reason:
          "INVALID_DEPARTMENT" as const
      };
    }
  }

  if (
    branch &&
    department &&
    department.branchId !== null &&
    department.branchId !== branch.id
  ) {
    return {
      success: false as const,
      reason:
        "BRANCH_DEPARTMENT_MISMATCH" as const
    };
  }

  return {
    success: true as const
  };
}

function hasContactIdentity(
  contact: {
    firstName?: string | null;
    lastName?: string | null;
    organizationName?: string | null;
  }
) {
  return Boolean(
    contact.firstName ||
    contact.lastName ||
    contact.organizationName
  );
}

export async function getContactsByOrganization(
  organizationId: string,
  filters: ContactFilters = {}
) {
  const search =
    filters.search?.trim();

  return prisma.contact.findMany({
    where: {
      organizationId,

      ...(filters.contactType
        ? {
            contactType:
              filters.contactType
          }
        : {}),

      ...(filters.status
        ? {
            status:
              filters.status
          }
        : {}),

      ...(filters.branchId
        ? {
            branchId:
              filters.branchId
          }
        : {}),

      ...(filters.departmentId
        ? {
            departmentId:
              filters.departmentId
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                organizationName: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive"
                }
              },
              {
                phone: {
                  contains: search
                }
              }
            ]
          }
        : {})
    },

    include:
      contactInclude,

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
    },

    include:
      contactInclude
  });
}

export async function createContactForOrganization(
  organizationId: string,
  data: CreateContactInput
) {
  const structureValidation =
    await validateStructureAssignment(
      organizationId,
      data.branchId,
      data.departmentId
    );

  if (!structureValidation.success) {
    return structureValidation;
  }

  const contact =
    await prisma.contact.create({
      data: {
        organizationId,
        contactType:
          data.contactType,

        ...(data.branchId !== undefined
          ? {
              branchId:
                data.branchId
            }
          : {}),

        ...(data.departmentId !== undefined
          ? {
              departmentId:
                data.departmentId
            }
          : {}),

        ...(data.firstName !== undefined
          ? {
              firstName:
                data.firstName
            }
          : {}),

        ...(data.lastName !== undefined
          ? {
              lastName:
                data.lastName
            }
          : {}),

        ...(data.organizationName !== undefined
          ? {
              organizationName:
                data.organizationName
            }
          : {}),

        ...(data.email !== undefined
          ? {
              email:
                data.email
            }
          : {}),

        ...(data.phone !== undefined
          ? {
              phone:
                data.phone
            }
          : {}),

        ...(data.secondaryPhone !== undefined
          ? {
              secondaryPhone:
                data.secondaryPhone
            }
          : {}),

        ...(data.nationalId !== undefined
          ? {
              nationalId:
                data.nationalId
            }
          : {}),

        ...(data.dateOfBirth !== undefined
          ? {
              dateOfBirth:
                data.dateOfBirth
            }
          : {}),

        ...(data.address !== undefined
          ? {
              address:
                data.address
            }
          : {}),

        ...(data.city !== undefined
          ? {
              city:
                data.city
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
              country:
                data.country
            }
          : {}),

        ...(data.status !== undefined
          ? {
              status:
                data.status
            }
          : {})
      },

      include:
        contactInclude
    });

  return {
    success: true as const,
    data: contact
  };
}

export async function updateContactForOrganization(
  id: string,
  organizationId: string,
  data: UpdateContactInput
) {
  const existing =
    await prisma.contact.findFirst({
      where: {
        id,
        organizationId
      },

      include:
        contactInclude
    });

  if (!existing) {
    return {
      success: false as const,
      reason:
        "NOT_FOUND" as const
    };
  }

  const targetBranchId =
    data.branchId !== undefined
      ? data.branchId
      : existing.branchId;

  const targetDepartmentId =
    data.departmentId !== undefined
      ? data.departmentId
      : existing.departmentId;

  const structureValidation =
    await validateStructureAssignment(
      organizationId,
      targetBranchId,
      targetDepartmentId
    );

  if (!structureValidation.success) {
    return structureValidation;
  }

  const targetIdentity = {
    firstName:
      data.firstName !== undefined
        ? data.firstName
        : existing.firstName,

    lastName:
      data.lastName !== undefined
        ? data.lastName
        : existing.lastName,

    organizationName:
      data.organizationName !== undefined
        ? data.organizationName
        : existing.organizationName
  };

  if (!hasContactIdentity(targetIdentity)) {
    return {
      success: false as const,
      reason:
        "IDENTITY_REQUIRED" as const
    };
  }

  const contact =
    await prisma.contact.update({
      where: {
        id
      },

      data,

      include:
        contactInclude
    });

  return {
    success: true as const,
    data: contact,
    oldValues: existing
  };
}

export async function deleteContactForOrganization(
  id: string,
  organizationId: string
) {
  const existing =
    await prisma.contact.findFirst({
      where: {
        id,
        organizationId
      },

      include:
        contactInclude
    });

  if (!existing) {
    return {
      success: false as const,
      reason:
        "NOT_FOUND" as const
    };
  }

  await prisma.contact.delete({
    where: {
      id
    }
  });

  return {
    success: true as const,
    data: existing
  };
}