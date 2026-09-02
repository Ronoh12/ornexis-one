import {
  HealthScopeType
} from "../../../../packages/database/generated/client/enums.js";

import {
  prisma
} from "../../../../packages/database/index.js";

import {
  evaluateOrganizationHealth
} from "./healthEvaluationService.js";

type ScopeResult = {
  scopeType: HealthScopeType;
  scopeId: string;
  outcome:
    | "created"
    | "existing"
    | "failed";
  snapshotId?: string;
  score?: number;
  confidence?: number;
  error?: string;
};

export async function evaluateAllOrganizationHealth(
  input?: {
    now?: Date;
    periodStart?: Date;
    periodEnd?: Date;
  }
) {
  const organizations =
    await prisma.organization.findMany({
      orderBy: {
        id: "asc"
      },
      select: {
        id: true,
        branches: {
          orderBy: {
            id: "asc"
          },
          select: {
            id: true
          }
        },
        departments: {
          orderBy: {
            id: "asc"
          },
          select: {
            id: true
          }
        }
      }
    });

  const results:
    Array<{
      organizationId: string;
      scopes: ScopeResult[];
    }> = [];

  let scanned = 0;
  let created = 0;
  let existing = 0;
  let failed = 0;

  for (
    const organization
    of organizations
  ) {
    const scopes = [
      {
        scopeType:
          HealthScopeType.ORGANIZATION,
        scopeId:
          organization.id
      },
      ...organization.branches.map(
        (branch) => ({
          scopeType:
            HealthScopeType.BRANCH,
          scopeId:
            branch.id
        })
      ),
      ...organization.departments.map(
        (department) => ({
          scopeType:
            HealthScopeType.DEPARTMENT,
          scopeId:
            department.id
        })
      )
    ];

    const organizationResults:
      ScopeResult[] = [];

    for (const scope of scopes) {
      scanned += 1;

      try {
        const evaluation =
          await evaluateOrganizationHealth(
            organization.id,
            {
              scopeType:
                scope.scopeType,
              branchId:
                scope.scopeType ===
                  HealthScopeType.BRANCH
                  ? scope.scopeId
                  : null,
              departmentId:
                scope.scopeType ===
                  HealthScopeType.DEPARTMENT
                  ? scope.scopeId
                  : null
            },
            input
          );

        if (
          evaluation.outcome ===
          "created"
        ) {
          created += 1;
        } else {
          existing += 1;
        }

        organizationResults.push({
          scopeType:
            scope.scopeType,
          scopeId:
            scope.scopeId,
          outcome:
            evaluation.outcome,
          snapshotId:
            evaluation.snapshot.id,
          score:
            evaluation.snapshot.score,
          confidence:
            evaluation.snapshot.confidence
        });
      } catch (error) {
        failed += 1;

        organizationResults.push({
          scopeType:
            scope.scopeType,
          scopeId:
            scope.scopeId,
          outcome:
            "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unknown health evaluation failure."
        });
      }
    }

    results.push({
      organizationId:
        organization.id,
      scopes:
        organizationResults
    });
  }

  return {
    organizations:
      organizations.length,
    scanned,
    created,
    existing,
    failed,
    results
  };
}
