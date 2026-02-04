module.exports = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.mjs": ["eslint --fix", "prettier --write"],
  "packages/workhorse/**/*.py": ["python -m black", "python -m ruff check --fix"],
};
