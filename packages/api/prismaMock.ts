import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

import { prisma } from "../src/infrastructure/db/prisma";

/**
 * Prisma Mock Client
 *
 * Used for unit tests where a real database connection is not required.
 * This leverages jest-mock-extended to provide full type safety.
 */
jest.mock("../src/infrastructure/db/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
