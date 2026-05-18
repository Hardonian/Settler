/** @type {import('jest').Config} */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@settler/reconciliation-core$": "<rootDir>/../reconciliation-core/src/index.ts",
    "^@settler/reconciliation-core/dist$": "<rootDir>/../reconciliation-core/src/index.ts",
    "^@settler/reconciliation-core/dist/(.*)$": "<rootDir>/../reconciliation-core/src/$1",
    "^(?:\\.\\./)+reconciliation-core/dist$": "<rootDir>/../reconciliation-core/src/index.ts",
    "^(?:\\.\\./)+reconciliation-core/dist/(.*)$": "<rootDir>/../reconciliation-core/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    // Strip .js extensions from relative imports so ts-jest can resolve .ts sources
    // in workspace packages (e.g. @settler/reconciliation-core uses ESM-style .js refs)
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^uuid$": require.resolve("uuid"),
  },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  testPathIgnorePatterns: ["<rootDir>/src/__tests__/e2e/"],
  testMatch: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.{spec,test}.{js,jsx,ts,tsx}"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/**/*.spec.{js,jsx,ts,tsx}",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
