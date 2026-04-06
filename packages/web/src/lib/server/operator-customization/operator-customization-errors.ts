import { NextResponse } from "next/server";

/**
 * Detect Prisma errors that indicate customization tables/columns are missing (migration not applied).
 * Uses structural check so we do not depend on Prisma error class export surface across versions.
 */
export function isOperatorCustomizationSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = (error as { code?: unknown }).code;
  return code === "P2021" || code === "P2022";
}

export function customizationSchemaNotReadyResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "schema_not_ready",
      code: "operator_customization_migration_required",
      message:
        "Operator customization persistence is unavailable until the latest database migration is applied.",
    },
    { status: 503 }
  );
}
