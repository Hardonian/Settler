module.exports = {
  root: true,
  extends: ["../../.eslintrc.js"],
  ignorePatterns: ["*.d.ts"],
  rules: {
    // Relax no-unsafe rules for adapters due to third-party API response typing limitations
    // Runtime validation ensures correct types; these are warnings, not errors
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
  },
};
