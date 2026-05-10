module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@settler/support-intake$": "<rootDir>/../support-intake/src/index.ts",
    "^@settler/adapters$": "<rootDir>/../adapters/src/index.ts",
    "^@settler/reconciliation-core$": "<rootDir>/../reconciliation-core/src/index.ts",
    "^@settler/types$": "<rootDir>/../types/src/index.ts",
    "^uuid$": require.resolve("uuid"),
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "src/__tests__/setup\\.ts$",
    "src/__tests__/utils/",
    "src/__tests__/type-tests\\.ts$",
  ],
};
