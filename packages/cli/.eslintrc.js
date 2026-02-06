module.exports = {
  root: true,
  extends: ["../../.eslintrc.js"],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/no-unsafe-call": "warn", // Commander.js has loose types
    "@typescript-eslint/require-await": "warn",
  },
  overrides: [
    {
      files: ["src/**/*.ts"],
      rules: {
        "no-console": "off", // CLI intentionally uses console.log for user output
      },
    },
  ],
};
