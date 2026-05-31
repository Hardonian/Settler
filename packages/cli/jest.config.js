module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Increased to accommodate kernel-client timeout test which involves a 5-second
  // kernel operation timeout plus process teardown overhead.
  testTimeout: 20000,
  transform: {
    "^.+.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transformIgnorePatterns: ["node_modules/(?!(chalk)/)"],
};
