function readPackage(pkg, context) {
  if (pkg.name === "prisma" && pkg.version === "7.10.0" && pkg.dependencies?.mysql2) {
    pkg.dependencies.mysql2 = "3.24.4";
    context.log("Pinned prisma mysql2 dependency to patched 3.24.4");
  }

  if (
    pkg.name === "@prisma/config" &&
    pkg.version === "7.10.0" &&
    pkg.dependencies?.["deepmerge-ts"]
  ) {
    pkg.dependencies["deepmerge-ts"] = "8.0.2";
    context.log("Pinned @prisma/config deepmerge-ts dependency to patched 8.0.2");
  }

  return pkg;
}

module.exports = { hooks: { readPackage } };
