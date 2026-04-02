/**
 * ESLint v9 Flat Config
 * Migrated from .eslintrc.js for ESLint v9 compatibility
 */

const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const eventTaxonomyRule = require("./tools/eslint-rules/event-taxonomy-rule");

module.exports = [
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      ".next",
      "out",
      "coverage",
      "scaffold-repro",
      "tmp",
      "test-results",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
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
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],

      // MONOREPO BOUNDARY ENFORCEMENT
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
  },

  {
    files: [
      "platform/**/*.ts",
      "packages/api/src/services/**/*.ts",
      "packages/web/src/app/api/**/*.ts",
      "scripts/**/*.ts",
    ],
    ignores: ["**/__tests__/**"],
    plugins: {
      local: {
        rules: {
          "event-taxonomy": eventTaxonomyRule,
        },
      },
    },
    rules: {
      "local/event-taxonomy": "error",
    },
  },
  {
    files: ["packages/web/src/app/(marketing)/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/app/**", "@/app/console/**", "@/app/admin/**", "@/app/dashboard/**"],
              message: "Marketing surface cannot import app-shell modules.",
            },
            {
              group: ["@/env/server", "@/env/server/**"],
              message: "Marketing surface cannot import server-only env.",
            },
          ],
        },
      ],
    },
  },
  // CLI package: allow console.log for CLI output (must come after general config to override)
  {
    files: ["packages/cli/src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
