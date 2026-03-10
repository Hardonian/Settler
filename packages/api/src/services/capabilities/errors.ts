export function isMissingOptionalCapabilityDependency(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("undefined_table") ||
    message.includes("relation")
  );
}
