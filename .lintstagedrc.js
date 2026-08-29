const sourceFiles = (files) => files.filter((file) => !/(^|[\\/])dist([\\/]|$)/.test(file));

const quote = (file) => JSON.stringify(file.replaceAll("\\", "/"));

const lintAndFormat = (files) => {
  const sources = sourceFiles(files);
  if (sources.length === 0) {
    return [];
  }

  const paths = sources.map(quote).join(" ");
  return [`eslint --fix ${paths}`, `prettier --write ${paths}`];
};

const format = (files) => {
  const sources = sourceFiles(files);
  return sources.length === 0 ? [] : [`prettier --write ${sources.map(quote).join(" ")}`];
};

module.exports = {
  "*.{ts,tsx}": lintAndFormat,
  "*.{js,jsx}": lintAndFormat,
  "*.{json,yml,yaml}": format,
  "*.mjs": lintAndFormat,
  "packages/workhorse/**/*.py": ["python -m black", "python -m ruff check --fix"],
};

// Exclude generated output even if a historical artifact is still tracked.
