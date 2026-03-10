import { isUndefinedTableError } from "./pg-errors";

export function isMissingOptionalCapabilityDependency(error: unknown): boolean {
  return isUndefinedTableError(error);
}
