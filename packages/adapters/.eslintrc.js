module.exports = {
  root: true,
  extends: ["../../.eslintrc.js"],
  ignorePatterns: ["*.d.ts"],
  rules: {
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/require-await": "warn",
  },
};
