module.exports = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.mjs": ["eslint --fix", "prettier --write"],
  "packages/workhorse/**/*.py": [
    "cd packages/workhorse && python -m black",
    "cd packages/workhorse && python -m ruff check --fix",
  ],
};
