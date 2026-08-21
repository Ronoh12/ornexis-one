import { prisma } from "../../../../packages/database/index.js";

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

const CONTACT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED"
] as const;

const ORGANIZATION_USER_STATUSES = [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REMOVED"
] as const;

export async function getDashboardOverview(
  organizationId: string
) {
  const [
    totalContacts,
    activeContacts,
    inactiveContacts,
    archivedContacts,
    assignedContacts,

    totalOrganizationUsers,
    invitedOrganizationUsers,
    activeOrganizationUsers,
    suspendedOrganizationUsers,

    totalBranches,
    activeBranches,

    totalDepartments,
    activeDepartments,

    contactsByTypeRaw,
    contactsByStatusRaw,
    contactsByBranchRaw
  ] = await Promise.all([
    prisma.contact.count({
      where: {
        organizationId
      }
    }),

    prisma.contact.count({
      where: {
        organizationId,
        status: "ACTIVE"
      }
    }),

    prisma.contact.count({
      where: {
        organizationId,
        status: "INACTIVE"
      }
    }),

    prisma.contact.count({
      where: {
        organizationId,
        status: "ARCHIVED"
      }
    }),

    prisma.contact.count({
      where: {
        organizationId,
        OR: [
          {
            branchId: {
              not: null
            }
          },
          {
            departmentId: {
              not: null
            }
          }
        ]
      }
    }),

    prisma.organizationUser.count({
      where: {
        organizationId
      }
    }),

    prisma.organizationUser.count({
      where: {
        organizationId,
        status: "INVITED"
      }
    }),

    prisma.organizationUser.count({
      where: {
        organizationId,
        status: "ACTIVE"
      }
    }),

    prisma.organizationUser.count({
      where: {
        organizationId,
        status: "SUSPENDED"
      }
    }),

    prisma.branch.count({
      where: {
        organizationId
      }
    }),

    prisma.branch.count({
      where: {
        organizationId,
        isActive: true
      }
    }),

    prisma.department.count({
      where: {
        organizationId
      }
    }),

    prisma.department.count({
      where: {
        organizationId,
        isActive: true
      }
    }),

    prisma.contact.groupBy({
      by: [
        "contactType"
      ],

      where: {
        organizationId
      },

      _count: {
        _all: true
      },

      orderBy: {
        contactType: "asc"
      }
    }),

    prisma.contact.groupBy({
      by: [
        "status"
      ],

      where: {
        organizationId
      },

      _count: {
        _all: true
      },

      orderBy: {
        status: "asc"
      }
    }),

    prisma.contact.groupBy({
      by: [
        "branchId"
      ],

      where: {
        organizationId,
        branchId: {
          not: null
        }
      },

      _count: {
        _all: true
      }
    })
  ]);

  const branchIds =
    contactsByBranchRaw
      .map(
        item =>
          item.branchId
      )
      .filter(
        (
          branchId
        ): branchId is string =>
          branchId !== null
      );

  const branches =
    branchIds.length > 0
      ? await prisma.branch.findMany({
          where: {
            organizationId,
            id: {
              in: branchIds
            }
          },

          select: {
            id: true,
            name: true,
            code: true
          },

          orderBy: {
            name: "asc"
          }
        })
      : [];

  const branchById =
    new Map(
      branches.map(
        branch => [
          branch.id,
          branch
        ]
      )
    );

  const contactTypeCountMap =
    new Map(
      contactsByTypeRaw.map(
        item => [
          item.contactType,
          item._count._all
        ]
      )
    );

  const contactStatusCountMap =
    new Map(
      contactsByStatusRaw.map(
        item => [
          item.status,
          item._count._all
        ]
      )
    );

  const contactsByType =
    CONTACT_TYPES.map(
      contactType => ({
        contactType,
        count:
          contactTypeCountMap.get(
            contactType
          ) ?? 0
      })
    );

  const contactsByStatus =
    CONTACT_STATUSES.map(
      status => ({
        status,
        count:
          contactStatusCountMap.get(
            status
          ) ?? 0
      })
    );

  const contactsByBranch =
    contactsByBranchRaw
      .map(item => {
        if (!item.branchId) {
          return null;
        }

        const branch =
          branchById.get(
            item.branchId
          );

        if (!branch) {
          return null;
        }

        return {
          branchId:
            branch.id,

          name:
            branch.name,

          code:
            branch.code,

          contactCount:
            item._count._all
        };
      })
      .filter(
        (
          item
        ): item is {
          branchId: string;
          name: string;
          code: string | null;
          contactCount: number;
        } =>
          item !== null
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

  const inactiveBranches =
    totalBranches -
    activeBranches;

  const inactiveDepartments =
    totalDepartments -
    activeDepartments;

  const unassignedContacts =
    totalContacts -
    assignedContacts;

  const removedOrganizationUsers =
    Math.max(
      0,
      totalOrganizationUsers -
        invitedOrganizationUsers -
        activeOrganizationUsers -
        suspendedOrganizationUsers
    );

  return {
    contacts: {
      total:
        totalContacts,

      active:
        activeContacts,

      inactive:
        inactiveContacts,

      archived:
        archivedContacts,

      assigned:
        assignedContacts,

      unassigned:
        unassignedContacts
    },

    organizationUsers: {
      total:
        totalOrganizationUsers,

      invited:
        invitedOrganizationUsers,

      active:
        activeOrganizationUsers,

      suspended:
        suspendedOrganizationUsers,

      removed:
        removedOrganizationUsers
    },

    structure: {
      branches: {
        total:
          totalBranches,

        active:
          activeBranches,

        inactive:
          inactiveBranches
      },

      departments: {
        total:
          totalDepartments,

        active:
          activeDepartments,

        inactive:
          inactiveDepartments
      }
    },

    contactsByType,

    contactsByStatus,

    contactsByBranch
  };
}