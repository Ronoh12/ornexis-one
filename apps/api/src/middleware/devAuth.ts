import type {
  NextFunction,
  Request,
  Response
} from "express";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    organizationId: string;
  };
};

export function devAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  req.auth = {
    userId: "2dd536c5-47a0-4fea-9a4f-643b9e739908",
    organizationId: "8313ce42-eab4-410a-ba60-b669e58ff3e9"
  };

  next();
}