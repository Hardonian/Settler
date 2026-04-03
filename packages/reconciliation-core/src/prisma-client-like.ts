/**
 * Canonical Prisma client contract for reconciliation-core.
 *
 * Keep this interface limited to the subset of Prisma delegate methods used by
 * reconciliation-core so package typecheck does not depend on generated
 * `@prisma/client` artifacts.
 */
export interface ReconciliationCorePrismaClient {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  [delegate: string]: any;
}
