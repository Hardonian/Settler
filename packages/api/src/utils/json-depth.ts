export interface JsonDepthOptions {
  maxDepth?: number;
}

export function scanJsonDepth(input: Buffer | string, options: JsonDepthOptions = {}): number {
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;
  const text = typeof input === "string" ? input : input.toString("utf8");
  let depth = 0;
  let maxObserved = 0;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (char === "\\\\") {
        escaping = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
      if (depth > maxObserved) {
        maxObserved = depth;
        if (maxObserved > maxDepth) {
          return maxObserved;
        }
      }
      continue;
    }

    if (char === "}" || char === "]") {
      depth = Math.max(0, depth - 1);
    }
  }

  return maxObserved;
}

export function countJsonDepth(value: unknown, options: JsonDepthOptions = {}): number {
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return 0;
  }

  let maxObserved = 0;
  const stack: Array<{ node: Record<string, unknown>; depth: number }> = [
    { node: value as Record<string, unknown>, depth: 1 },
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (current.depth > maxObserved) {
      maxObserved = current.depth;
      if (maxObserved > maxDepth) {
        return maxObserved;
      }
    }

    for (const key in current.node) {
      if (!Object.prototype.hasOwnProperty.call(current.node, key)) {
        continue;
      }
      const child = current.node[key];
      if (child && typeof child === "object" && !Array.isArray(child)) {
        stack.push({ node: child as Record<string, unknown>, depth: current.depth + 1 });
      }
    }
  }

  return maxObserved;
}
