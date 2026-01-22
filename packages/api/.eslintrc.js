module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  extends: ["../../.eslintrc.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/await-thenable": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  overrides: [
    {
      // Relax no-unsafe rules for config files due to envalid library typing limitations
      // Runtime validation ensures type safety; the EnvVars interface provides compile-time types downstream
      files: ["src/config/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
      },
    },
    {
      // Relax no-unsafe rules for logger.ts due to winston library typing limitations
      // Winston's format API has incomplete type definitions
      files: ["src/utils/logger.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/unbound-method": "warn",
      },
    },
  ],
  env: {
    node: true,
    es2022: true,
  },
};
