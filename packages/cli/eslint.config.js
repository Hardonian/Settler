/**
 * ESLint v9 Flat Config for @settler/cli
 * Extends root configuration
 */

const rootConfig = require("../../eslint.config.js");

module.exports = [
  ...rootConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts"],
  },
  // CLI package: allow console.log for user-facing output
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
