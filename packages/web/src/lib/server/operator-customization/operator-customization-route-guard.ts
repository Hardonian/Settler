import { NextResponse } from "next/server";
import {
  customizationSchemaNotReadyResponse,
  isOperatorCustomizationSchemaMissingError,
} from "./operator-customization-errors";

/** Map Prisma P2021/P2022 to a truthful 503 for operator customization routes. */
export async function handleOperatorCustomizationRoute(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (isOperatorCustomizationSchemaMissingError(e)) {
      return customizationSchemaNotReadyResponse();
    }
    throw e;
  }
}
