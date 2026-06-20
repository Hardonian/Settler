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
  return readFileIfPresent(path.join(process.cwd(), ".nvmrc")) || "22.17.0";
}

function readRequiredNodeRange() {
  const rootPackage = readRootPackageJson();
  return rootPackage.engines?.node || ">=22.0.0 <23.0.0";
}

function formatNodeRequirement() {
  return {
    requiredVersion: readRequiredNodeVersion(),
    requiredRange: readRequiredNodeRange(),
  };
}

function assertSupportedNodeVersion(context = "this command") {
  const { requiredVersion, requiredRange } = formatNodeRequirement();
  const requiredMajor = Number(requiredVersion.split(".")[0] ?? 24);
  const currentMajor = Number(process.versions.node.split(".")[0] ?? 0);

  if (currentMajor !== requiredMajor) {
    const error = new Error(
      `${context} requires Node ${requiredVersion} (${requiredRange}); active runtime is ${process.version}. Switch to the repo Node 24 toolchain before continuing.`
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
