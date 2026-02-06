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
      files: ["src/commands/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-call": "off", // Commander.js API uses any types
        "@typescript-eslint/no-unsafe-member-access": "off", // Commander.js options are loosely typed
        "@typescript-eslint/no-unsafe-assignment": "off", // Commander.js returns are loosely typed
        "no-console": "off", // CLI commands intentionally use console.log for user output
      },
    },
    {
      files: ["src/**/*.ts"],
      rules: {
        "no-console": ["warn", { allow: ["warn", "error", "log"] }], // Allow console.log in CLI
      },
    },
  ],
};
