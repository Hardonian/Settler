import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { discoverExpressRoutes, discoverRouteRegistry } from "../security-route-registry.mjs";

function withFixture(mutator) {
  const root = mkdtempSync(path.join(os.tmpdir(), "settler-route-registry-"));
  mutator(root);
  return root;
}

test("discoverExpressRoutes expands nested express router mounts", () => {
  const root = withFixture((fixtureRoot) => {
    mkdirSync(path.join(fixtureRoot, "packages/api/src/routes/v1"), { recursive: true });

    writeFileSync(
      path.join(fixtureRoot, "packages/api/src/index.ts"),
      `
import { authRouter } from "./routes/auth";
import { v1Router } from "./routes/v1";

const app = {};
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", v1Router);
app.get("/api/csrf-token", getCsrfToken);
      `,
      "utf8"
    );

    writeFileSync(
      path.join(fixtureRoot, "packages/api/src/routes/auth.ts"),
      `
import { Router } from "express";
const router = Router();
router.post("/login", (_req, res) => res.json({ ok: true }));
export { router as authRouter };
      `,
      "utf8"
    );

    writeFileSync(
      path.join(fixtureRoot, "packages/api/src/routes/v1/index.ts"),
      `
import { Router } from "express";
import { runsRouter } from "./runs";
export const v1Router = Router();
v1Router.use("/", runsRouter);
v1Router.get("/health", (_req, res) => res.json({ ok: true }));
      `,
      "utf8"
    );

    writeFileSync(
      path.join(fixtureRoot, "packages/api/src/routes/v1/runs.ts"),
      `
import { Router } from "express";
const router = Router();
router.get("/runs", (_req, res) => res.json({ ok: true }));
router.get("/runs/:id", (_req, res) => res.json({ ok: true }));
export { router as runsRouter };
      `,
      "utf8"
    );
  });

  try {
    const routes = discoverExpressRoutes(root);
    const routePaths = routes.map((route) => route.route);
    assert.ok(routePaths.includes("/api/v1/auth/login"));
    assert.ok(routePaths.includes("/api/v1/runs"));
    assert.ok(routePaths.includes("/api/v1/runs/:id"));
    assert.ok(routePaths.includes("/api/csrf-token"));

    const authRoute = routes.find((route) => route.route === "/api/v1/auth/login");
    assert.equal(authRoute?.kind, "express-router");
    assert.deepEqual(authRoute?.methods, ["POST"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("discoverRouteRegistry includes both next app-router and express routes", () => {
  const root = withFixture((fixtureRoot) => {
    mkdirSync(path.join(fixtureRoot, "packages/web/src/app/api/health"), { recursive: true });
    mkdirSync(path.join(fixtureRoot, "packages/api/src/routes"), { recursive: true });

    writeFileSync(
      path.join(fixtureRoot, "packages/web/src/app/api/health/route.ts"),
      `export async function GET() { return Response.json({ ok: true }); }`,
      "utf8"
    );

    writeFileSync(
      path.join(fixtureRoot, "packages/api/src/index.ts"),
      `
import { healthRouter } from "./routes/health";
const app = {};
app.use("/health", healthRouter);
      `,
      "utf8"
    );

    writeFileSync(
      path.join(fixtureRoot, "packages/api/src/routes/health.ts"),
      `
import { Router } from "express";
const router = Router();
router.get("/", (_req, res) => res.json({ ok: true }));
export { router as healthRouter };
      `,
      "utf8"
    );
  });

  try {
    const routes = discoverRouteRegistry(root);
    assert.ok(routes.some((route) => route.kind === "next-app-router" && route.route === "/api/health"));
    assert.ok(routes.some((route) => route.kind === "express-router" && route.route === "/health"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
