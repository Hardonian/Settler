import ts from "typescript";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CANONICAL_EVENT_TYPES, EVENT_TYPE_ALIASES } from "../platform/event-protocol";

const ROOT = resolve(process.cwd());

function gatherFiles(command: string): string[] {
  try {
    const out = execSync(command, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] })
      .toString()
      .trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function isAllowedEventType(eventType: string): boolean {
  return CANONICAL_EVENT_TYPES.has(eventType) || eventType in EVENT_TYPE_ALIASES;
}

function checkFile(filePath: string): string[] {
  const content = readFileSync(resolve(ROOT, filePath), "utf8");
  const source = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );
  const violations: string[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      if (node.expression.name.text === "emitEvent" && node.arguments.length > 0) {
        const eventTypeArg = node.arguments[0];
        if (ts.isStringLiteral(eventTypeArg)) {
          if (!isAllowedEventType(eventTypeArg.text)) {
            const { line, character } = source.getLineAndCharacterOfPosition(
              eventTypeArg.getStart()
            );
            violations.push(
              `${filePath}:${line + 1}:${character + 1} unknown eventBus.emitEvent type '${eventTypeArg.text}'`
            );
          }
        } else if (!filePath.includes("__tests__/")) {
          const { line, character } = source.getLineAndCharacterOfPosition(eventTypeArg.getStart());
          violations.push(
            `${filePath}:${line + 1}:${character + 1} dynamic event type expression in eventBus.emitEvent is not allowed`
          );
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const keyName = ts.isIdentifier(node.name)
        ? node.name.text
        : ts.isStringLiteral(node.name)
          ? node.name.text
          : null;

      if (keyName === "eventType" && ts.isStringLiteral(node.initializer)) {
        const eventType = node.initializer.text;
        if (
          filePath.includes("platform/") &&
          !filePath.includes("platform/__tests__/event-protocol.test.ts") &&
          !isAllowedEventType(eventType)
        ) {
          const { line, character } = source.getLineAndCharacterOfPosition(
            node.initializer.getStart()
          );
          violations.push(
            `${filePath}:${line + 1}:${character + 1} unknown PlatformEvent.eventType '${eventType}'`
          );
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return violations;
}

const files = gatherFiles(
  "rg --files platform packages/api/src/services packages/web/src/app/api scripts --glob '*.ts' --glob '!**/dist/**'"
);

const violations = files.flatMap(checkFile);

if (violations.length > 0) {
  console.error("❌ Event taxonomy verification failed:");
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.warn(`✅ Event taxonomy verification passed for ${files.length} files.`);
