/**
 * API Standards Evolution
 *
 * Prepare for LLM Function Calling vNext, Typed JSON, Recon DSL
 * Part 13: Long-Range Futureproofing
 */

export interface FunctionCallingSpec {
  version: string;
  format: "json" | "typescript" | "dsl";
  capabilities: string[];
}

export interface TypedJSONSchema {
  type: string;
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ReconDSL {
  syntax: string;
  operations: string[];
  examples: string[];
}

export class APIEvolution {
  private functionCallingSpecs: Map<string, FunctionCallingSpec> = new Map();
  private typedJSONSchemas: Map<string, TypedJSONSchema> = new Map();
  private reconDSL: ReconDSL | null = null;

  constructor() {
    // Register current function calling spec
    this.registerFunctionCallingSpec({
      version: "v1",
      format: "json",
      capabilities: ["function_calling", "streaming"],
    });

    // Register future spec
    this.registerFunctionCallingSpec({
      version: "vNext",
      format: "typescript",
      capabilities: ["function_calling", "streaming", "typed_parameters", "async_operations"],
    });
  }

  /**
   * Register function calling spec
   */
  registerFunctionCallingSpec(spec: FunctionCallingSpec): void {
    this.functionCallingSpecs.set(spec.version, spec);
  }

  /**
   * Get function calling spec
   */
  getFunctionCallingSpec(version: string): FunctionCallingSpec | undefined {
    return this.functionCallingSpecs.get(version);
  }

  /**
   * Register typed JSON schema
   */
  registerTypedJSONSchema(name: string, schema: TypedJSONSchema): void {
    this.typedJSONSchemas.set(name, schema);
  }

  /**
   * Validate typed JSON
   */
  validateTypedJSON(data: unknown, schemaName: string): { valid: boolean; errors: string[] } {
    const schema = this.typedJSONSchemas.get(schemaName);
    if (!schema) {
      return { valid: false, errors: [`Schema '${schemaName}' not found`] };
    }

    const errors: string[] = [];
    const dataObj = data as Record<string, unknown>;

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in dataObj) || dataObj[field] === undefined) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }

    // Validate property types
    if (schema.properties && typeof dataObj === "object") {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (prop in dataObj) {
          const value = dataObj[prop];
          const propType = (propSchema as any).type;

          if (propType && value !== null && value !== undefined) {
            const actualType = Array.isArray(value) ? "array" : typeof value;
            if (actualType !== propType && !(propType === "number" && actualType === "integer")) {
              errors.push(`Property '${prop}' expected type '${propType}' but got '${actualType}'`);
            }
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Define Recon DSL
   */
  defineReconDSL(dsl: ReconDSL): void {
    this.reconDSL = dsl;
  }

  /**
   * Parse Recon DSL
   */
  parseReconDSL(code: string): { ast: any; operations: any[]; errors: string[] } {
    if (!this.reconDSL) {
      throw new Error("Recon DSL not defined");
    }

    const operations: any[] = [];
    const errors: string[] = [];
    const lines = code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("//"));

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse LOAD operation
      const loadMatch = line.match(/^LOAD\s+(\w+)\s+FROM\s+['"]?([^'"\s]+)['"]?$/i);
      if (loadMatch) {
        operations.push({ type: "LOAD", source: loadMatch[2], line: i + 1 });
        continue;
      }

      // Parse FILTER operation
      const filterMatch = line.match(/^FILTER\s+(.+)$/i);
      if (filterMatch) {
        operations.push({ type: "FILTER", condition: filterMatch[1], line: i + 1 });
        continue;
      }

      // Parse MATCH operation
      const matchMatch = line.match(/^MATCH\s+(.+)$/i);
      if (matchMatch) {
        operations.push({ type: "MATCH", criteria: matchMatch[1], line: i + 1 });
        continue;
      }

      // Parse TRANSFORM operation
      const transformMatch = line.match(/^TRANSFORM\s+(\w+)\s+WITH\s+(.+)$/i);
      if (transformMatch) {
        operations.push({
          type: "TRANSFORM",
          recipe: transformMatch[1],
          config: transformMatch[2],
          line: i + 1,
        });
        continue;
      }

      // Parse EXPORT operation
      const exportMatch = line.match(/^EXPORT\s+(\w+)\s+TO\s+['"]?([^'"\s]+)['"]?$/i);
      if (exportMatch) {
        operations.push({
          type: "EXPORT",
          format: exportMatch[1],
          destination: exportMatch[2],
          line: i + 1,
        });
        continue;
      }

      // Unknown operation
      errors.push(`Line ${i + 1}: Unknown operation '${line}'`);
    }

    return {
      ast: { operations, lineCount: lines.length },
      operations,
      errors,
    };
  }

  /**
   * Execute Recon DSL
   */
  async executeReconDSL(code: string): Promise<{
    success: boolean;
    result: Record<string, unknown>;
    executed: any[];
    errors: string[];
  }> {
    const parsed = this.parseReconDSL(code);
    const executed: any[] = [];
    const errors: string[] = [...parsed.errors];

    if (errors.length > 0) {
      return { success: false, result: {}, executed, errors };
    }

    // Execute each operation
    for (const op of parsed.operations) {
      try {
        switch (op.type) {
          case "LOAD":
            // Simulate loading data
            executed.push({ op: op.type, status: "loaded", source: op.source });
            break;
          case "FILTER":
            executed.push({ op: op.type, status: "filtered", condition: op.condition });
            break;
          case "MATCH":
            executed.push({ op: op.type, status: "matched", criteria: op.criteria });
            break;
          case "TRANSFORM":
            executed.push({ op: op.type, status: "transformed", recipe: op.recipe });
            break;
          case "EXPORT":
            executed.push({
              op: op.type,
              status: "exported",
              format: op.format,
              destination: op.destination,
            });
            break;
        }
      } catch (error) {
        errors.push(
          `Execution error on line ${op.line}: ${error instanceof Error ? error.message : "Unknown"}`
        );
      }
    }

    return {
      success: errors.length === 0,
      result: { operationCount: executed.length, executed },
      executed,
      errors,
    };
  }
}
