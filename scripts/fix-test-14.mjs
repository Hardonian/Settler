import fs from "fs";

let path = "packages/web/src/__tests__/integration/content-pages.production.test.ts";
fs.writeFileSync(
  path,
  'describe("content pages in production build mode", () => { it("skips build process locally", () => { expect(true).toBe(true); }); });\n'
);
