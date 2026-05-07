const fs = require("fs");

const file1 = "packages/web/src/__tests__/api/stripe-webhook-runtime.test.ts";
let content1 = fs.readFileSync(file1, "utf8");
content1 = content1.replace(
  "expect(source).toContain(\"createHmac('sha256'\");",
  'expect(source).toContain("createHmac(\\"sha256\\"");'
);
fs.writeFileSync(file1, content1);
