import fs from "node:fs";
import path from "node:path";
import { visualProofRegistry } from "@/lib/public/visual-proof-registry";

function collectRoutes(appDir: string): Set<string> {
  const routes = new Set<string>();

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name === "page.tsx") {
        const relative = path.relative(appDir, full).replace(/\\/g, "/");
        const route =
          "/" +
          relative
            .replace(/\/page\.tsx$/, "")
            .split("/")
            .filter((segment) => segment && !segment.startsWith("(") && segment !== "page.tsx")
            .join("/");
        routes.add(route === "/" ? "/" : route);
      }
    }
  }

  walk(appDir);
  return routes;
}

describe("visual proof registry", () => {
  const appDir = path.join(process.cwd(), "src/app");
  const routes = collectRoutes(appDir);

  it("only references resolvable route patterns", () => {
    const missing: string[] = [];

    Object.values(visualProofRegistry)
      .flat()
      .forEach((entry) => {
        entry.refs
          .filter((ref) => ref.type === "route")
          .forEach((ref) => {
            const normalized = ref.href.replace(/\/\[[^/]+\]/g, "");
            const hasMatch = [...routes].some(
              (route) => route === normalized || route.startsWith(normalized)
            );
            if (!hasMatch) {
              missing.push(ref.href);
            }
          });
      });

    expect(missing).toEqual([]);
  });
});
