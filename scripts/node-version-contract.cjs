const fs = require("node:fs");
const path = require("node:path");

function readFileIfPresent(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

function readRootPackageJson() {
  const packagePath = path.join(process.cwd(), "package.json");
  return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

function readRequiredNodeVersion() {
  return readFileIfPresent(path.join(process.cwd(), ".nvmrc")) || "24.15.0";
}

function readRequiredNodeRange() {
  const rootPackage = readRootPackageJson();
  return rootPackage.engines?.node || "24.x";
}

function formatNodeRequirement() {
  return {
    requiredVersion: readRequiredNodeVersion(),
    requiredRange: readRequiredNodeRange(),
  };
}

function assertSupportedNodeVersion(context = "this command") {
  if (process.env.SKIP_NODE_VERSION_CHECK === "true" || process.env.IGNORE_NODE_VERSION === "true") {
    return;
  }
  const { requiredVersion, requiredRange } = formatNodeRequirement();
  const requiredMajor = Number(requiredVersion.split(".")[0] ?? 24);
  const currentMajor = Number(process.versions.node.split(".")[0] ?? 0);

  if (currentMajor !== requiredMajor) {
    const error = new Error(
      `${context} requires Node ${requiredVersion} (${requiredRange}); active runtime is ${process.version}. Switch to the supported Node toolchain before continuing.`
    );
    error.code = "ERR_NODE_VERSION_MISMATCH";
    throw error;
  }
}

module.exports = {
  assertSupportedNodeVersion,
  formatNodeRequirement,
  readRequiredNodeRange,
  readRequiredNodeVersion,
};
