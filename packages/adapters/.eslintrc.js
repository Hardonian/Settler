module.exports = {
  root: true,
  extends: ['../../.eslintrc.js'],
  ignorePatterns: ['*.d.ts'],
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
  },
};
