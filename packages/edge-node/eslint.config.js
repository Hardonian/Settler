/**
 * ESLint v9 Flat Config for @settler/edge-node
 * Extends root configuration
 */

const rootConfig = require("../../eslint.config.js");

module.exports = [
  ...rootConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts"],
  },
];
