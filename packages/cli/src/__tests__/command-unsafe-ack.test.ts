declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;
declare const beforeEach: (fn: () => Promise<void> | void) => void;
declare const afterEach: (fn: () => void) => void;
declare const jest: any;

import path from "node:path";
function mockProcessExit(): () => void {
  const exitSpy = jest.spyOn(process, "exit").mockImplementation((code?: number) => {
    throw new Error(`EXIT_${code ?? 0}`);
  });

  return () => exitSpy.mockRestore();
}

describe("command-level unsafe acknowledgement behavior", () => {
  let restoreExit: (() => void) | undefined;
  let errorSpy: any;
  let commands: any;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    process.chdir(path.resolve(process.cwd(), "../.."));
    jest.resetModules();
    jest.doMock(
      "@settler/sdk",
      () => ({
        __esModule: true,
        default: class MockSettler {
          adapters = { list: async () => ({ data: [] }) };
        },
      }),
      { virtual: true }
    );

    const adapters = await import("../commands/adapters");
    const future = await import("../commands/future");
    commands = {
      adaptersCommand: adapters.adaptersCommand,
      rulesCommand: future.rulesCommand,
    };

    restoreExit = mockProcessExit();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (restoreExit) restoreExit();
    if (errorSpy) errorSpy.mockRestore();
    jest.dontMock("@settler/sdk");
    process.chdir(originalCwd);
  });

  test("adapters install without --allow-unsafe prints guidance", async () => {
    await expect(
      commands.adaptersCommand.parseAsync(
        ["node", "adapters", "install", "--name", "nonexistent"],
        {
          from: "node",
        }
      )
    ).rejects.toThrow("EXIT_1");

    const errorOutput = errorSpy.mock.calls.map((call: [string]) => String(call[0])).join("\n");
    expect(errorOutput).toContain("Re-run with --allow-unsafe");
  });

  test("adapters install with --allow-unsafe reaches package-not-found branch", async () => {
    await expect(
      commands.adaptersCommand.parseAsync(
        [
          "node",
          "adapters",
          "install",
          "--name",
          "nonexistent",
          "--allow-unsafe",
          "--registry",
          "marketplace/adapters/registry.json",
        ],
        { from: "node" }
      )
    ).rejects.toThrow("EXIT_1");

    const errorOutput = errorSpy.mock.calls.map((call: [string]) => String(call[0])).join("\n");
    expect(errorOutput).toContain("Adapter package not found: nonexistent");
  });

  test("rules install without --allow-unsafe prints guidance", async () => {
    await expect(
      commands.rulesCommand.parseAsync(["node", "rules", "install", "--name", "nonexistent"], {
        from: "node",
      })
    ).rejects.toThrow("EXIT_1");

    const errorOutput = errorSpy.mock.calls.map((call: [string]) => String(call[0])).join("\n");
    expect(errorOutput).toContain("Refusing install without --allow-unsafe acknowledgement");
  });

  test("rules install with --allow-unsafe reaches package-not-found branch", async () => {
    await expect(
      commands.rulesCommand.parseAsync(
        [
          "node",
          "rules",
          "install",
          "--name",
          "nonexistent",
          "--allow-unsafe",
          "--registry",
          "marketplace/rules/registry.json",
        ],
        { from: "node" }
      )
    ).rejects.toThrow("EXIT_1");

    const errorOutput = errorSpy.mock.calls.map((call: [string]) => String(call[0])).join("\n");
    expect(errorOutput).toContain("rules package not found: nonexistent");
  });
});
