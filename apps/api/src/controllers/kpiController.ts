import type {
  Request,
  Response
} from "express";

import {
  createKpiCategory,
  listKpiCategories,
  updateKpiCategory
} from "../services/kpiCategoryService.js";

import {
  createKpiDefinition,
  getKpiDefinition,
  listKpiDefinitions,
  updateKpiDefinition
} from "../services/kpiDefinitionService.js";

import {
  createManualKpiMeasurement,
  evaluateSystemKpi,
  getKpiMeasurement,
  getLatestKpiMeasurement,
  listKpiMeasurements
} from "../services/kpiMeasurementService.js";

import {
  KpiServiceError
} from "../services/kpiScopeService.js";

import {
  KpiValidationError,
  parseCreateKpiCategory,
  parseCreateKpiDefinition,
  parseKpiCategoryQuery,
  parseKpiDefinitionQuery,
  parseKpiId,
  parseKpiMeasurementQuery,
  parseManualKpiMeasurement,
  parseSystemKpiEvaluation,
  parseUpdateKpiCategory,
  parseUpdateKpiDefinition
} from "../validators/kpiValidator.js";

type AuthRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
    organizationUserId?: string;
  };
};

function actor(
  req: AuthRequest
) {
  const userId =
    req.auth?.userId;

  const organizationId =
    req.auth?.organizationId;

  const organizationUserId =
    req.auth?.organizationUserId;

  if (
    !userId ||
    !organizationId
  ) {
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
  if (
    error instanceof
      KpiValidationError
  ) {
    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof
      KpiServiceError
  ) {
    if (
      error.code ===
        "KPI_CATEGORY_NOT_FOUND" ||
      error.code ===
        "KPI_DEFINITION_NOT_FOUND" ||
      error.code ===
        "KPI_MEASUREMENT_NOT_FOUND" ||
      error.code ===
        "KPI_SCOPE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "KPI_SCOPE_FORBIDDEN" ||
      error.code ===
        "KPI_SCOPE_UNASSIGNED" ||
      error.code ===
        "KPI_MEMBERSHIP_INVALID" ||
      error.code ===
        "KPI_ORIGIN_FORBIDDEN" ||
      error.code ===
        "KPI_SOURCE_FORBIDDEN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.code ===
        "KPI_CATEGORY_CODE_CONFLICT" ||
      error.code ===
        "KPI_DEFINITION_CODE_CONFLICT"
    ) {
      return res.status(409).json({
        success: false,
        message:
          error.message
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  if (
    error instanceof Error
  ) {
    if (
      error.message ===
      "Authentication required"
    ) {
      return res.status(401).json({
        success: false,
        message:
          error.message
      });
    }

    if (
      error.message ===
      "Organization membership required"
    ) {
      return res.status(403).json({
        success: false,
        message:
          error.message
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message
    });
  }

  throw error;
}

export async function categories(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listKpiCategories(
        actor(req),
        parseKpiCategoryQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function createCategory(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createKpiCategory(
        actor(req),
        parseCreateKpiCategory(
          req.body
        )
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function updateCategory(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateKpiCategory(
        actor(req),
        parseKpiId(
          req.params.id
        ),
        parseUpdateKpiCategory(
          req.body
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function definitions(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listKpiDefinitions(
        actor(req),
        parseKpiDefinitionQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function definition(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getKpiDefinition(
        actor(req),
        parseKpiId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function createDefinition(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await createKpiDefinition(
        actor(req),
        parseCreateKpiDefinition(
          req.body
        )
      );

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function updateDefinition(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await updateKpiDefinition(
        actor(req),
        parseKpiId(
          req.params.id
        ),
        parseUpdateKpiDefinition(
          req.body
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function measurements(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await listKpiMeasurements(
        actor(req),
        parseKpiMeasurementQuery(
          req.query
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function measurement(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getKpiMeasurement(
        actor(req),
        parseKpiId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function latestMeasurement(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await getLatestKpiMeasurement(
        actor(req),
        parseKpiId(
          req.params.id
        )
      );

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function submitManualMeasurement(
  req: AuthRequest,
  res: Response
) {
  try {
    const definitionId =
      parseKpiId(
        req.params.id
      );

    const body =
      typeof req.body ===
          "object" &&
        req.body !== null &&
        !Array.isArray(
          req.body
        )
        ? req.body as
            Record<
              string,
              unknown
            >
        : req.body;

    const input =
      parseManualKpiMeasurement({
        ...(
          typeof body ===
            "object" &&
          body !== null
            ? body
            : {}
        ),
        definitionId
      });

    const data =
      await createManualKpiMeasurement(
        actor(req),
        input
      );

    return res
      .status(
        data.created
          ? 201
          : 200
      )
      .json({
        success: true,
        data
      });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}

export async function evaluate(
  req: AuthRequest,
  res: Response
) {
  try {
    const data =
      await evaluateSystemKpi(
        actor(req),
        parseSystemKpiEvaluation(
          req.body
        )
      );

    return res
      .status(
        data.created
          ? 201
          : 200
      )
      .json({
        success: true,
        data
      });
  } catch (error) {
    return handleError(
      res,
      error
    );
  }
}
