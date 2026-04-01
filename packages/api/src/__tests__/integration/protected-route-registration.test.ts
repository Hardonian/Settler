import fs from "fs";
import path from "path";

describe("protected route registration", () => {
  it("mounts the worker health router on protected API versions", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../../index.ts"), "utf8");

    expect(source).toContain('router.use("/worker", workerHealthRouter);');
  });

  it("keeps platform control plane behind tenant middleware", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../../index.ts"), "utf8");

    expect(source).toContain(
      'router.use("/tenant", tenantMiddleware, platformControlPlaneRouter);'
    );
  });
});
