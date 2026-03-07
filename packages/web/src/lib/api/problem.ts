import { NextResponse } from "next/server";

export type ProblemType =
  | "about:blank"
  | "https://settler.dev/problems/authentication"
  | "https://settler.dev/problems/validation"
  | "https://settler.dev/problems/not-found"
  | "https://settler.dev/problems/internal"
  | `https://settler.dev/problems/${string}`;

export interface ProblemDetails {
  type: ProblemType;
  title: string;
  status: number;
  detail: string;
  trace_id: string;
}

export interface ApiEnvelope<T> {
  data: T;
  trace_id: string;
}

export function buildProblemDetails(input: {
  type?: ProblemType;
  title: string;
  status: number;
  detail: string;
  traceId: string;
}): ProblemDetails {
  return {
    type: input.type ?? "about:blank",
    title: input.title,
    status: input.status,
    detail: input.detail,
    trace_id: input.traceId,
  };
}

export function buildOkEnvelope<T>(data: T, traceId: string): ApiEnvelope<T> {
  return { data, trace_id: traceId };
}

export function problemJson(problem: ProblemDetails): NextResponse {
  return NextResponse.json(problem, {
    status: problem.status,
    headers: { "content-type": "application/problem+json" },
  });
}

export function apiProblem(input: {
  type?: ProblemType;
  title: string;
  status: number;
  detail: string;
  traceId: string;
}): NextResponse {
  return problemJson(buildProblemDetails(input));
}

export function okJson<T>(data: T, traceId: string, status = 200): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json(buildOkEnvelope(data, traceId), { status });
}
