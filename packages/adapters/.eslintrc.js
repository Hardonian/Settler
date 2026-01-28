module.exports = {
  root: true,
  extends: ['../../.eslintrc.js'],
  ignorePatterns: ['*.d.ts'],
  rules: {
    // Relax type safety for third-party API integrations
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    '@typescript-eslint/no-floating-promises': 'warn',
  },
};
