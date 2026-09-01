import {
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalType,
  AttentionSourceType,
  Prisma
} from "../../../../packages/database/generated/client/client.js";

import {
  prisma
} from "../../../../packages/database/index.js";

export type AttentionSignalInput = {
  organizationId: string;
  signalType: AttentionSignalType;
  sourceType: AttentionSourceType;
  sourceId: string;
  title: string;
  summary: string;
  recommendedAction?: string | null;
  severity: AttentionSeverity;
  responsibleOrganizationUserId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  dueAt?: Date | null;
  detectedAt?: Date;
  fingerprint: string;
  metadata?: Prisma.InputJsonValue;
};

export type ReconciliationOutcome =
  | "created"
  | "updated"
  | "unchanged";

function sameDate(
  left: Date | null,
  right: Date | null
) {
  return left?.getTime() ===
    right?.getTime();
}

function sameValue(
  left: string | null,
  right: string | null | undefined
) {
  return left ===
    (right ?? null);
}

export async function reconcileAttentionSignal(
  input: AttentionSignalInput
): Promise<ReconciliationOutcome> {
  const existing =
    await prisma.attentionItem.findUnique({
      where: {
        organizationId_fingerprint: {
          organizationId:
            input.organizationId,
          fingerprint:
            input.fingerprint
        }
      }
    });

  if (!existing) {
    try {
      await prisma.attentionItem.create({
        data: {
          organizationId:
            input.organizationId,
          signalType:
            input.signalType,
          sourceType:
            input.sourceType,
          sourceId:
            input.sourceId,
          title:
            input.title,
          summary:
            input.summary,
          recommendedAction:
            input.recommendedAction ?? null,
          severity:
            input.severity,
          responsibleOrganizationUserId:
            input.responsibleOrganizationUserId ??
            null,
          branchId:
            input.branchId ?? null,
          departmentId:
            input.departmentId ?? null,
          dueAt:
            input.dueAt ?? null,
          detectedAt:
            input.detectedAt ??
            new Date(),
          fingerprint:
            input.fingerprint,
          ...(input.metadata !== undefined
            ? {
                metadata:
                  input.metadata
              }
            : {})
        }
      });

      return "created";
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return "unchanged";
      }

      throw error;
    }
  }

  if (
    existing.status ===
      AttentionItemStatus.RESOLVED ||
    existing.status ===
      AttentionItemStatus.DISMISSED
  ) {
    return "unchanged";
  }

  const changed =
    existing.title !== input.title ||
    existing.summary !== input.summary ||
    !sameValue(
      existing.recommendedAction,
      input.recommendedAction
    ) ||
    existing.severity !==
      input.severity ||
    !sameValue(
      existing.responsibleOrganizationUserId,
      input.responsibleOrganizationUserId
    ) ||
    !sameValue(
      existing.branchId,
      input.branchId
    ) ||
    !sameValue(
      existing.departmentId,
      input.departmentId
    ) ||
    !sameDate(
      existing.dueAt,
      input.dueAt ?? null
    );

  if (!changed) {
    return "unchanged";
  }

  await prisma.attentionItem.update({
    where: {
      id: existing.id
    },
    data: {
      title:
        input.title,
      summary:
        input.summary,
      recommendedAction:
        input.recommendedAction ?? null,
      severity:
        input.severity,
      responsibleOrganizationUserId:
        input.responsibleOrganizationUserId ??
        null,
      branchId:
        input.branchId ?? null,
      departmentId:
        input.departmentId ?? null,
      dueAt:
        input.dueAt ?? null,
      ...(input.metadata !== undefined
        ? {
            metadata:
              input.metadata
          }
        : {})
    }
  });

  return "updated";
}

export async function resolveAttentionItem(
  organizationId: string,
  id: string,
  resolvedAt = new Date()
) {
  const existing =
    await prisma.attentionItem.findFirst({
      where: {
        id,
        organizationId
      }
    });

  if (
    !existing ||
    existing.status ===
      AttentionItemStatus.RESOLVED ||
    existing.status ===
      AttentionItemStatus.DISMISSED
  ) {
    return false;
  }

  await prisma.attentionItem.update({
    where: {
      id: existing.id
    },
    data: {
      status:
        AttentionItemStatus.RESOLVED,
      resolvedAt
    }
  });

  return true;
}

export function attentionFingerprint(
  signalType: AttentionSignalType,
  sourceType: AttentionSourceType,
  sourceId: string,
  occurrence: string
) {
  return [
    signalType,
    sourceType,
    sourceId,
    occurrence
  ].join(":");
}
