import type {
  Request,
  Response
} from "express";

import {
  cancelWorkflow,
  createApprovalStep,
  createWorkflowDefinition,
  createWorkflowState,
  createWorkflowTransition,
  getWorkflowDefinition,
  getWorkflowInstance,
  listWorkflowDefinitions,
  startWorkflow,
  submitApprovalDecision,
  transitionWorkflow,
  updateWorkflowDefinition,
  updateWorkflowState,
  updateWorkflowTransition
} from "../services/workflowService.js";

import {
  parseApprovalDecision,
  parseCancelWorkflow,
  parseCreateApprovalStep,
  parseCreateWorkflowDefinition,
  parseCreateWorkflowState,
  parseCreateWorkflowTransition,
  parseId,
  parseStartWorkflow,
  parseUpdateWorkflowDefinition,
  parseUpdateWorkflowState,
  parseUpdateWorkflowTransition,
  parseWorkflowTransitionAction
} from "../validators/workflowValidator.js";


type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
    organizationUserId?: string;
  };
};


function compactInput<T extends Record<string, unknown>>(
  input: T
) {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined
    )
  ) as {
    [K in keyof T as undefined extends T[K]
      ? K
      : K]: Exclude<T[K], undefined>
  };
}


function actor(
  req: AuthRequest
) {
  const userId =
    req.auth?.userId;

  const organizationId =
    req.auth?.organizationId;

  const organizationUserId =
    req.auth?.organizationUserId;

  if (!userId || !organizationId) {
    throw new Error(
      "Authentication required"
    );
  }

  if (!organizationUserId) {
    throw new Error(
      "Organization membership required"
    );
  }

  return {
    userId,
    organizationId,
    organizationUserId
  };
}


function handleError(
  res: Response,
  error: unknown
) {
  if (error instanceof Error) {
    const message =
      error.message;

    const lower =
      message.toLowerCase();

    if (
      lower.includes(
        "not found"
      )
    ) {
      return res.status(404).json({
        success: false,
        message
      });
    }

    if (
      message ===
        "Authentication required"
    ) {
      return res.status(401).json({
        success: false,
        message
      });
    }

    if (
      message ===
        "Organization membership required"
    ) {
      return res.status(403).json({
        success: false,
        message
      });
    }

    if (
      lower.includes(
        "approval"
      ) ||
      lower.includes(
        "transition"
      ) ||
      lower.includes(
        "workflow"
      )
    ) {
      return res.status(400).json({
        success: false,
        message
      });
    }

    return res.status(400).json({
      success: false,
      message
    });
  }

  return res.status(500).json({
    success: false,
    message:
      "Unexpected workflow error"
  });
}


/* =========================================================
   WORKFLOW DEFINITIONS
========================================================= */

export async function list(
  req: AuthRequest,
  res: Response
) {
  try {
    const result =
      await listWorkflowDefinitions(
        actor(req).organizationId
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function getOne(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseId(req.params.id);

    const result =
      await getWorkflowDefinition(
        actor(req).organizationId,
        id
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function create(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      compactInput(parseCreateWorkflowDefinition(
        req.body
      ));

    const result =
      await createWorkflowDefinition(
        actor(req),
        input
      );

    return res.status(201).json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function update(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseId(req.params.id);

    const input =
      compactInput(parseUpdateWorkflowDefinition(
        req.body
      ));

    const result =
      await updateWorkflowDefinition(
        actor(req),
        id,
        input
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


/* =========================================================
   WORKFLOW STATES
========================================================= */

export async function createState(
  req: AuthRequest,
  res: Response
) {
  try {
    const workflowDefinitionId =
      parseId(req.params.id);

    const input =
      compactInput(parseCreateWorkflowState(
        req.body
      ));

    const result =
      await createWorkflowState(
        actor(req),
        workflowDefinitionId,
        input
      );

    return res.status(201).json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function updateState(
  req: AuthRequest,
  res: Response
) {
  try {
    const workflowDefinitionId =
      parseId(req.params.id);

    const stateId =
      parseId(req.params.stateId);

    const input =
      compactInput(parseUpdateWorkflowState(
        req.body
      ));

    const result =
      await updateWorkflowState(
        actor(req),
        workflowDefinitionId,
        stateId,
        input
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


/* =========================================================
   WORKFLOW TRANSITIONS
========================================================= */

export async function createTransition(
  req: AuthRequest,
  res: Response
) {
  try {
    const workflowDefinitionId =
      parseId(req.params.id);

    const input =
      compactInput(parseCreateWorkflowTransition(
        req.body
      ));

    const result =
      await createWorkflowTransition(
        actor(req),
        workflowDefinitionId,
        input
      );

    return res.status(201).json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function updateTransition(
  req: AuthRequest,
  res: Response
) {
  try {
    const workflowDefinitionId =
      parseId(req.params.id);

    const transitionId =
      parseId(
        req.params.transitionId
      );

    const input =
      compactInput(parseUpdateWorkflowTransition(
        req.body
      ));

    const result =
      await updateWorkflowTransition(
        actor(req),
        workflowDefinitionId,
        transitionId,
        input
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


/* =========================================================
   APPROVAL CONFIGURATION
========================================================= */

export async function createApproval(
  req: AuthRequest,
  res: Response
) {
  try {
    const workflowDefinitionId =
      parseId(req.params.id);

    const input =
      compactInput(parseCreateApprovalStep(
        req.body
      ));

    const result =
      await createApprovalStep(
        actor(req),
        workflowDefinitionId,
        input
      );

    return res.status(201).json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


/* =========================================================
   WORKFLOW INSTANCES
========================================================= */

export async function getInstance(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseId(req.params.id);

    const result =
      await getWorkflowInstance(
        actor(req).organizationId,
        id
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function start(
  req: AuthRequest,
  res: Response
) {
  try {
    const input =
      parseStartWorkflow(
        req.body
      );

    const result =
      await startWorkflow(
        actor(req),
        input
      );

    return res.status(201).json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function transition(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseId(req.params.id);

    const input =
      compactInput(parseWorkflowTransitionAction(
        req.body
      ));

    const result =
      await transitionWorkflow(
        actor(req),
        id,
        input
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function approve(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseId(req.params.id);

    const input =
      compactInput(parseApprovalDecision(
        req.body
      ));

    const result =
      await submitApprovalDecision(
        actor(req),
        id,
        input
      );

    return res.status(201).json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}


export async function cancel(
  req: AuthRequest,
  res: Response
) {
  try {
    const id =
      parseId(req.params.id);

    const input =
      compactInput(parseCancelWorkflow(
        req.body
      ));

    const result =
      await cancelWorkflow(
        actor(req),
        id,
        input
      );

    return res.json({
      success: true,
      data: result
    });
  }
  catch (error) {
    return handleError(
      res,
      error
    );
  }
}
