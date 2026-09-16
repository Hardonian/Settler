import { CanadaCogAdapter, canadaCogAdapter } from "../canada-cog";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("canada-cog adapter", () => {
  let originalEnabled: string | undefined;
  let originalBaseUrl: string | undefined;

  beforeEach(() => {
    originalEnabled = process.env.CANADA_COG_ENABLED;
    originalBaseUrl = process.env.CANADA_COG_BASE_URL;
  });

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.CANADA_COG_ENABLED;
    else process.env.CANADA_COG_ENABLED = originalEnabled;
    if (originalBaseUrl === undefined) delete process.env.CANADA_COG_BASE_URL;
    else process.env.CANADA_COG_BASE_URL = originalBaseUrl;
  });

  it("exports a singleton + class", () => {
    expect(canadaCogAdapter).toBeInstanceOf(CanadaCogAdapter);
    expect(canadaCogAdapter.name).toBe("canada-cog");
    expect(canadaCogAdapter.version).toBe("1.0.0");
  });

  it("reports disabled when CANADA_COG_ENABLED is not set", async () => {
    delete process.env.CANADA_COG_ENABLED;
    expect(await canadaCogAdapter.health()).toBe("disabled");
    expect(await canadaCogAdapter.fetchForecast()).toEqual([]);
  });

  it("reports disabled when CANADA_COG_ENABLED is not 1/true", async () => {
    process.env.CANADA_COG_ENABLED = "0";
    expect(await canadaCogAdapter.health()).toBe("disabled");
    process.env.CANADA_COG_ENABLED = "yes";
    expect(await canadaCogAdapter.health()).toBe("disabled");
  });

  it("returns low-confidence empty record set when endpoint unreachable", async () => {
    process.env.CANADA_COG_ENABLED = "1";
    process.env.CANADA_COG_BASE_URL = "http://127.0.0.1:1"; // unreachable
    const ctl = new AbortController();
    ctl.abort();
    const health = await canadaCogAdapter.health({ signal: ctl.signal });
    expect(["error", "ok"]).toContain(health);
    const records = await canadaCogAdapter.fetchForecast({
      projectId: "test-project",
      signal: ctl.signal,
    });
    expect(records).toHaveLength(1);
    expect(records[0]?.confidence).toBe("low");
    expect(records[0]?.note).toMatch(/cog fetch failed/);
    expect(records[0]?.buildabilityScore).toBeNull();
  });

  it("documents CEGS SpecVersion 0.1 in the adapter source", () => {
    const source = readFileSync(
      join(__dirname, "..", "canada-cog.ts"),
      "utf8",
    );
    expect(source).toContain('EXPECTED_CEGS_VERSION = "0.1"');
  });
});