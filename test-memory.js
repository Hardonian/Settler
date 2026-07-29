const records = 100000;
console.log(`Generating ${records} mock records...`);

const data = Array.from({ length: records }, (_, i) => ({
  metadata: {
    model: ["gpt-4", "gpt-3.5", "claude", "unknown"][i % 4],
    cost: Math.random() * 0.5,
    tokens: Math.floor(Math.random() * 100),
  },
}));

const memBefore = process.memoryUsage().heapUsed;

console.log(`Starting in-memory aggregation...`);
const start = performance.now();
const modelUsage = {};
for (const call of data) {
  const metadata = call.metadata || {};
  const model = metadata.model || "unknown";
  const cost = metadata.cost || 0;
  const tokens = metadata.tokens || 0;

  if (!modelUsage[model]) {
    modelUsage[model] = { calls: 0, tokens: 0, cost: 0 };
  }
  const usage = modelUsage[model];
  usage.calls++;
  usage.tokens += tokens;
  usage.cost += cost;
}
const end = performance.now();
const memAfter = process.memoryUsage().heapUsed;

console.log(`Time taken: ${(end - start).toFixed(2)}ms`);
console.log(`Extra Heap Used: ${((memAfter - memBefore) / 1024 / 1024).toFixed(2)} MB`);
