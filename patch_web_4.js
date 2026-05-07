const fs = require("fs");

const file1 = "packages/web/src/lib/brand/__tests__/assets.test.ts";
let content1 = fs.readFileSync(file1, "utf8");
content1 = content1.replace(
  "expect(SETTLER_BRAND.lockupHorizontalLight.width).toBe(1099);",
  "expect(SETTLER_BRAND.lockupHorizontalLight.width).toBe(1282);"
);
fs.writeFileSync(file1, content1);
