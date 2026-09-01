/**
 * Enhanced ESLint configuration for boundary enforcement
 * Prevents cross-package source imports in the monorepo
 */

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/await-thenable": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-console": ["warn", { allow: ["warn", "error"] }],

    // MONOREPO BOUNDARY ENFORCEMENT
    // Prevent importing from package src directories - use workspace dependencies instead
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../**/packages/*/src/**"],
            message:
              "Importing from package src directories is not allowed. Use the workspace package (e.g., '@settler/types') instead.",
          },
          {
            group: [
              "**/packages/api/src/**",
              "**/packages/web/src/**",
              "**/packages/sdk/src/**",
              "**/packages/types/src/**",
              "**/packages/adapters/src/**",
              "**/packages/protocol/src/**",
              "**/packages/react-settler/src/**",
              "**/packages/cli/src/**",
              "**/packages/edge-node/src/**",
              "**/packages/edge-ai-core/src/**",
            ],
            message:
              "Direct imports from package source directories are not allowed. Use workspace:* dependencies and proper exports.",
          },
        ],
      },
    ],
  },
  ignorePatterns: ["node_modules", "dist", "build", ".next", "coverage"],
};
