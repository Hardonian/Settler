/**
 * Safe, zero-crash frontmatter parser for Next.js App Router and static export.
 * Replaces legacy gray-matter to avoid CJS/ESM interop and yaml.safeLoad.bind issues in Next.js 16.
 */

export interface ParsedFrontmatter<T = Record<string, any>> {
  data: T;
  content: string;
}

export function parseFrontmatter<T = Record<string, any>>(rawSource: string): ParsedFrontmatter<T> {
  if (!rawSource || typeof rawSource !== "string") {
    return { data: {} as T, content: "" };
  }

  const trimmed = rawSource.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    return { data: {} as T, content: trimmed };
  }

  // Find closing delimiter
  const secondDelimiterIndex = trimmed.indexOf("\n---", 3);
  if (secondDelimiterIndex === -1) {
    return { data: {} as T, content: trimmed };
  }

  const rawYaml = trimmed.slice(3, secondDelimiterIndex).trim();
  const content = trimmed.slice(secondDelimiterIndex + 4).replace(/^[\r\n]+/, "");

  const data: Record<string, any> = {};

  // Parse simple YAML lines
  const lines = rawYaml.split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, colonIndex).trim();
    let valueStr = trimmedLine.slice(colonIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (valueStr.startsWith('"') && valueStr.endsWith('"')) ||
      (valueStr.startsWith("'") && valueStr.endsWith("'"))
    ) {
      valueStr = valueStr.slice(1, -1);
    }

    // Type coercion
    if (valueStr === "true") {
      data[key] = true;
    } else if (valueStr === "false") {
      data[key] = false;
    } else if (valueStr === "null") {
      data[key] = null;
    } else if (/^-?\d+(\.\d+)?$/.test(valueStr) && !Number.isNaN(Number(valueStr))) {
      data[key] = Number(valueStr);
    } else {
      data[key] = valueStr;
    }
  }

  return {
    data: data as T,
    content,
  };
}
