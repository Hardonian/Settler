module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  moduleNameMapper: {
    "^uuid$": "<rootDir>/test-support/uuid.ts",
    "^(?:\\.\\./)+reconciliation-core/dist$": "<rootDir>/../reconciliation-core/src/index.ts",
    "^(?:\\.\\./)+reconciliation-core/dist/(.*?)(?:\\.js)?$":
      "<rootDir>/../reconciliation-core/src/$1",
    "^@settler/types$": "<rootDir>/../types/src/index.ts",
    "^@settler/types/(.*?)(?:\\.js)?$": "<rootDir>/../types/src/$1",
    "^@settler/support-intake$": "<rootDir>/../support-intake/src/index.ts",
    "^@settler/support-intake/(.*?)(?:\\.js)?$": "<rootDir>/../support-intake/src/$1",
    "^@settler/adapters$": "<rootDir>/../adapters/src/index.ts",
    "^@settler/adapters/(.*?)(?:\\.js)?$": "<rootDir>/../adapters/src/$1",
    "^@settler/reconciliation-core$": "<rootDir>/../reconciliation-core/src/index.ts",
    "^@settler/reconciliation-core/(.*?)(?:\\.js)?$": "<rootDir>/../reconciliation-core/src/$1",
    "^@settler/proofs$": "<rootDir>/../proofs/src/index.ts",
    "^@settler/proofs/(.*?)(?:\\.js)?$": "<rootDir>/../proofs/src/$1",
    "^@settler/protocol$": "<rootDir>/../protocol/src/index.ts",
    "^@settler/protocol/(.*?)(?:\\.js)?$": "<rootDir>/../protocol/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
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
