export function summarizeNextTrace(traceText, limit = 20) {
  const spans = [];
  for (const line of traceText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    if (Array.isArray(parsed)) spans.push(...parsed);
  }

  const longestByName = new Map();
  for (const span of spans) {
    if (typeof span?.name !== "string" || typeof span?.duration !== "number") continue;
    const durationMs = span.duration / 1_000;
    const current = longestByName.get(span.name);
    if (!current || durationMs > current.durationMs) {
      longestByName.set(span.name, {
        name: span.name,
        durationMs: Math.round(durationMs * 10) / 10,
      });
    }
  }

  return [...longestByName.values()]
    .sort((left, right) => right.durationMs - left.durationMs)
    .slice(0, limit);
}
