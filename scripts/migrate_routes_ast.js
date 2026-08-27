const { Project, SyntaxKind } = require("ts-morph");
const path = require("path");

const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "packages/api/tsconfig.json"),
});

const sourceFiles = project.getSourceFiles("packages/api/src/routes/**/*.ts");

for (const sourceFile of sourceFiles) {
  let changed = false;
  const filePath = sourceFile.getFilePath();

  // Skip exempt files
  if (
    filePath.endsWith("auth.ts") ||
    filePath.endsWith("health.ts") ||
    filePath.endsWith("worker-health.ts")
  ) {
    continue;
  }

  // Find db imports
  const importDecls = sourceFile.getImportDeclarations().filter((i) => {
    const modSpec = i.getModuleSpecifierValue();
    return modSpec.endsWith("db") || modSpec.endsWith("db/index");
  });

  if (importDecls.length === 0) continue;

  let needsQueryWithTenant = false;
  let needsTransactionWithTenant = false;

  // Find all query calls
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();

    // Check for query(...)
    if (expr.getText() === "query") {
      needsQueryWithTenant = true;
      expr.replaceWithText("queryWithTenant");

      // We must insert tenantId as first argument
      // Let's assume tenantId is available in scope. We just push "tenantId" as the first arg.
      // But wait! What if it already is? The previous script ran and broke things, but we git restored.
      const args = callExpr.getArguments();
      callExpr.insertArgument(0, "tenantId");
      changed = true;
    }

    // Check for client.query(...) inside transactions
    if (expr.getText() === "client.query") {
      // In a transaction, if we are inside a transactionWithTenant, the client is already bound!
      // But wait, if they used raw pool.connect(), we should find them.
      // Actually, if they used client.query, we don't need to change it if we wrap the whole transaction!
    }

    // Check for transaction(...)
    if (expr.getText() === "transaction") {
      needsTransactionWithTenant = true;
      expr.replaceWithText("transactionWithTenant");
      callExpr.insertArgument(0, "tenantId");
      changed = true;
    }
  }

  if (changed) {
    for (const importDecl of importDecls) {
      const namedImports = importDecl.getNamedImports();
      const hasQuery = namedImports.some((n) => n.getName() === "query");
      const hasTransaction = namedImports.some((n) => n.getName() === "transaction");

      if (needsQueryWithTenant && !namedImports.some((n) => n.getName() === "queryWithTenant")) {
        importDecl.addNamedImport("queryWithTenant");
      }
      if (
        needsTransactionWithTenant &&
        !namedImports.some((n) => n.getName() === "transactionWithTenant")
      ) {
        importDecl.addNamedImport("transactionWithTenant");
      }

      // Remove the old ones if not used anymore
      const unusedQuery =
        sourceFile
          .getDescendantsOfKind(SyntaxKind.Identifier)
          .filter((i) => i.getText() === "query").length <= 1; // 1 for the import itself
      if (hasQuery && unusedQuery) {
        const imp = namedImports.find((n) => n.getName() === "query");
        if (imp) imp.remove();
      }

      const unusedTransaction =
        sourceFile
          .getDescendantsOfKind(SyntaxKind.Identifier)
          .filter((i) => i.getText() === "transaction").length <= 1;
      if (hasTransaction && unusedTransaction) {
        const imp = namedImports.find((n) => n.getName() === "transaction");
        if (imp) imp.remove();
      }
    }
    sourceFile.saveSync();
    console.log(`Updated ${filePath}`);
  }
}
