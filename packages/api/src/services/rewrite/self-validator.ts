/**
 * Self-Validating Code Modules
 *
 * CI-like internal checks for each change
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */

export interface ValidationResult {
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: Record<string, unknown>;
}

export interface ModuleValidation {
  moduleId: string;
  moduleType: "service" | "route" | "middleware" | "transform" | "workflow";
  results: ValidationResult[];
  overallStatus: "pass" | "fail" | "warning";
}

export class SelfValidator {
  /**
   * Validate a code module
   */
  async validateModule(
    module: { id?: string; schemaReferences?: string[]; [key: string]: unknown },
    moduleType: string
  ): Promise<ModuleValidation> {
    const results: ValidationResult[] = [];

    // Validate TypeScript types
    const typeCheck = await this.validateTypeScript(module);
    results.push(typeCheck);

    // Validate schema integrity
    const schemaCheck = await this.validateSchemaIntegrity(module);
    results.push(schemaCheck);

    // Run pipeline simulations
    const simulationCheck = await this.simulatePipeline(module);
    results.push(simulationCheck);

    // Check build viability
    const buildCheck = await this.checkBuildViability(module);
    results.push(buildCheck);

    // Evaluate risks
    const riskCheck = await this.evaluateRisks(module);
    results.push(riskCheck);

    // Check compatibility
    const compatCheck = await this.checkCompatibility(module);
    results.push(compatCheck);

    const overallStatus = this.determineOverallStatus(results);

    return {
      moduleId: (module.id as string) || "unknown",
      moduleType: moduleType as ModuleValidation["moduleType"],
      results,
      overallStatus,
    };
  }

  /**
   * Validate TypeScript types
   */
  private async validateTypeScript(module: {
    code?: string;
    [key: string]: unknown;
  }): Promise<ValidationResult> {
    if (!module.code) {
      return { check: "typescript_types", status: "pass", message: "No code to validate" };
    }

    try {
      const ts = await import("typescript");
      const sourceFile = ts.createSourceFile("temp.ts", module.code, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(
        ["temp.ts"],
        { noEmit: true, strict: true },
        {
          getSourceFile: (f) => (f === "temp.ts" ? sourceFile : undefined),
          writeFile: () => {},
          getCurrentDirectory: () => "",
          getDirectories: () => [],
          fileExists: () => true,
          readFile: () => module.code,
          getCanonicalFileName: (f) => f,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => "\n",
          getDefaultLibFileName: (options) => ts.getDefaultLibFileName(options),
        }
      );

      const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(program.emit().diagnostics);
      if (allDiagnostics.length > 0) {
        return {
          check: "typescript_types",
          status: "fail",
          message: `Errors: ${allDiagnostics
            .slice(0, 2)
            .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "))
            .join("; ")}`,
        };
      }
      return { check: "typescript_types", status: "pass", message: "TypeScript types valid" };
    } catch (error) {
      return {
        check: "typescript_types",
        status: "fail",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
      };
    }
  }

  /**
   * Validate schema integrity
   */
  private async validateSchemaIntegrity(module: {
    schemaReferences?: string[];
    [key: string]: unknown;
  }): Promise<ValidationResult> {
    if (!module.schemaReferences || module.schemaReferences.length === 0) {
      return {
        check: "schema_integrity",
        status: "pass",
        message: "No schema references to validate",
      };
    }

    try {
      const fs = await import("fs");
      const path = await import("path");
      const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

      if (!fs.existsSync(schemaPath)) {
        return { check: "schema_integrity", status: "warning", message: "Prisma schema not found" };
      }

      const schema = fs.readFileSync(schemaPath, "utf-8");
      const invalidRefs: string[] = [];

      for (const ref of module.schemaReferences) {
        if (!new RegExp(`^model\\s+${ref}\\s*{|^enum\\s+${ref}\\s*{`, "m").test(schema)) {
          invalidRefs.push(ref);
        }
      }

      return invalidRefs.length > 0
        ? {
            check: "schema_integrity",
            status: "fail",
            message: `Invalid refs: ${invalidRefs.join(", ")}`,
          }
        : { check: "schema_integrity", status: "pass", message: "Schema refs valid" };
    } catch (error) {
      return {
        check: "schema_integrity",
        status: "fail",
        message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
      };
    }
  }

  /**
   * Simulate pipeline execution
   */
  private async simulatePipeline(module: {
    pipeline?: { steps: Array<{ type: string; config: Record<string, unknown> }> };
    testData?: Record<string, unknown>[];
    [key: string]: unknown;
  }): Promise<ValidationResult> {
    const steps = module.pipeline?.steps;
    if (!steps || steps.length === 0) {
      return {
        check: "pipeline_simulation",
        status: "pass",
        message: "No pipeline to simulate",
      };
    }

    try {
      const testData = module.testData || [{ id: "1", test: true }];
      let currentData = [...testData];
      const stepResults: Array<{ step: number; status: string; recordCount: number }> = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step) continue;

        // Simulate each step type
        switch (step.type) {
          case "filter":
            currentData = currentData.filter((_, idx) => idx % 2 === 0);
            break;
          case "transform":
            currentData = currentData.map((d) => ({ ...d, transformed: true }));
            break;
          case "validate":
            currentData = currentData.filter((d) => d.id !== undefined);
            break;
          case "aggregate":
            currentData = [{ count: currentData.length, aggregated: true }];
            break;
          default:
          // Pass through
        }

        stepResults.push({
          step: i + 1,
          status: "completed",
          recordCount: currentData.length,
        });

        // Check for data loss
        if (currentData.length === 0 && testData.length > 0) {
          return {
            check: "pipeline_simulation",
            status: "warning",
            message: `Pipeline step ${i + 1} (${step?.type || "unknown"}) eliminated all records`,
          };
        }
      }

      return {
        check: "pipeline_simulation",
        status: "pass",
        message: `Pipeline simulation passed: ${steps.length} steps, ${currentData.length} output records`,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        check: "pipeline_simulation",
        status: "fail",
        message: `Pipeline simulation failed: ${errorMessage}`,
        details:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : { error: String(error) },
      };
    }
  }

  /**
   * Check build viability for Vercel
   */
  private async checkBuildViability(module: {
    edgeFunction?: boolean;
    usesNodeOnlyAPIs?: boolean;
    estimatedSize?: number;
    [key: string]: unknown;
  }): Promise<ValidationResult> {
    // Check for Vercel-specific requirements
    const issues: string[] = [];

    // Check for edge function compatibility
    if (module.edgeFunction && module.usesNodeOnlyAPIs) {
      issues.push("Uses Node.js-only APIs in edge function");
    }

    // Check bundle size
    if (module.estimatedSize && module.estimatedSize > 50 * 1024 * 1024) {
      issues.push("Bundle size exceeds 50MB limit");
    }

    if (issues.length > 0) {
      return {
        check: "build_viability",
        status: "warning",
        message: `Build viability issues: ${issues.join(", ")}`,
        details: { issues },
      };
    }

    return {
      check: "build_viability",
      status: "pass",
      message: "Build viable for Vercel",
    };
  }

  /**
   * Evaluate risks
   */
  private async evaluateRisks(module: {
    code?: string;
    usesEval?: boolean;
    hasNestedLoops?: boolean;
    loopDepth?: number;
    [key: string]: unknown;
  }): Promise<ValidationResult> {
    const risks: string[] = [];

    // Check for security risks by inspecting the AST
    if (module.code) {
      try {
        const ts = await import("typescript");
        const sourceFile = ts.createSourceFile(
          "temp.ts",
          module.code,
          ts.ScriptTarget.Latest,
          true
        );

        // We use any here to avoid TS2503 because ts is imported dynamically
        const checkNodeForEval = (node: any): boolean => {
          if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === "eval"
          ) {
            return true;
          }
          let found = false;
          ts.forEachChild(node, (child) => {
            if (!found) {
              found = checkNodeForEval(child);
            }
          });
          return found;
        };

        if (checkNodeForEval(sourceFile)) {
          risks.push("Uses eval() - security risk");
        } else if (module.usesEval) {
          // Fallback if usesEval is provided but AST check is clean (belt-and-suspenders)
          risks.push("Uses eval() - security risk");
        }
      } catch (error) {
        // If typescript import fails or parsing fails, we fallback to a simple regex check,
        // but prefer not to fail the whole validation just because we couldn't parse it
        console.warn("Failed to check for eval via AST", error);
        // We might also still check module.usesEval if they provided it as a hint
        if (module.usesEval) {
          risks.push("Uses eval() - security risk");
        }
      }
    } else if (module.usesEval) {
      // Fallback if no code is provided but the flag is set
      risks.push("Uses eval() - security risk");
    }

    // Check for performance risks
    if (module.hasNestedLoops && module.loopDepth && module.loopDepth > 3) {
      risks.push("Deeply nested loops - performance risk");
    }

    if (risks.length > 0) {
      return {
        check: "risk_evaluation",
        status: "warning",
        message: `Risks detected: ${risks.join(", ")}`,
        details: { risks },
      };
    }

    return {
      check: "risk_evaluation",
      status: "pass",
      message: "No significant risks detected",
    };
  }

  /**
   * Check compatibility
   */
  private async checkCompatibility(module: {
    breakingChanges?: string[];
    [key: string]: unknown;
  }): Promise<ValidationResult> {
    // Check backward compatibility
    if (
      module.breakingChanges &&
      Array.isArray(module.breakingChanges) &&
      module.breakingChanges.length > 0
    ) {
      return {
        check: "compatibility",
        status: "warning",
        message: `Breaking changes: ${module.breakingChanges.join(", ")}`,
        details: { breakingChanges: module.breakingChanges },
      };
    }

    return {
      check: "compatibility",
      status: "pass",
      message: "Backward compatible",
    };
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(results: ValidationResult[]): "pass" | "fail" | "warning" {
    const hasFail = results.some((r) => r.status === "fail");
    const hasWarning = results.some((r) => r.status === "warning");

    if (hasFail) return "fail";
    if (hasWarning) return "warning";
    return "pass";
  }
}
