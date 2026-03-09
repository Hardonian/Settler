import { Response } from "express";
import { AuthRequest } from "../middleware/auth";

export interface ProblemJsonOptions {
  status: number;
  title: string;
  detail: string;
  code: string;
  type?: string;
  extra?: Record<string, unknown>;
}

export function sendProblemJson(
  req: AuthRequest,
  res: Response,
  options: ProblemJsonOptions
): void {
  const problem: Record<string, unknown> = {
    type: options.type ?? `https://docs.settler.dev/problems/${options.code.toLowerCase()}`,
    title: options.title,
    status: options.status,
    detail: options.detail,
    code: options.code,
    timestamp: new Date().toISOString(),
    trace_id: req.traceId,
    execution_id: req.executionId,
    tenant_id: req.tenantId,
  };

  if (options.extra) {
    Object.assign(problem, options.extra);
  }

  res.setHeader("Content-Type", "application/problem+json");
  res.status(options.status).json(problem);
}
