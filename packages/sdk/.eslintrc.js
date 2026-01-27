module.exports = {
  root: true,
  extends: ["../../.eslintrc.js"],
  ignorePatterns: ["**/__tests__/**", "**/*.test.ts", "dist"],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/no-var-requires": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
  },
};
