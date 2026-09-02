import type {
  CommandCapability
} from "./commandCentreTypes.js";

export type CommandCentreApprovalSummary = {
  available: false;
  pending: null;
  overdue: null;
  assignedToCurrentMember: null;
};

export async function loadCommandCentreApprovals(
  permitted: boolean
): Promise<
  CommandCapability<
    CommandCentreApprovalSummary
  >
> {
  if (!permitted) {
    return {
      status: "FORBIDDEN",
      reason:
        "Approval details require workflow.view permission.",
      data: null
    };
  }

  return {
    status: "UNAVAILABLE",
    reason:
      "Reliable pending approval instances with deterministic Branch and Department scope are not yet represented by authoritative Workflow records.",
    data: {
      available: false,
      pending: null,
      overdue: null,
      assignedToCurrentMember:
        null
    }
  };
}
