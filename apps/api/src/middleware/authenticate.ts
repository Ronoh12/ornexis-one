import type {
  NextFunction,
  Request,
  Response
} from "express";

import jwt from "jsonwebtoken";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

type JwtPayload = {
  userId: string;
};

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authorizationHeader =
    req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const token =
    authorizationHeader.slice(7);

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  try {
    const payload =
      jwt.verify(
        token,
        jwtSecret
      ) as JwtPayload;

    req.auth = {
      userId: payload.userId
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}