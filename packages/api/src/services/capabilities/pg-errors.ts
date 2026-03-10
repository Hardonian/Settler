export const PG_UNDEFINED_TABLE = "42P01";

interface PgErrorLike {
  code?: string;
}

export function isUndefinedTableError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && (error as PgErrorLike).code === PG_UNDEFINED_TABLE
  );
}
