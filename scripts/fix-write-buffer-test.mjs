import fs from "fs";

let path = "packages/web/src/__tests__/lib/db/write-buffer.security.test.ts";
let content = fs.readFileSync(path, "utf8");

// The write buffer test still imports from write-buffer.ts, which imports from @upstash/redis, which imports uncrypto.
// Even mapping uncrypto to crypto didn't work because uncrypto has sub-modules? Wait, the error is still:
// SyntaxError: Unexpected token 'export' in /app/node_modules/.pnpm/uncrypto@0.1.3/node_modules/uncrypto/dist/crypto.web.mjs:15
// This means the module mapper didn't match it because it imports uncrypto/dist/crypto.web.mjs or something?
// Wait, the error is that `upstash/redis/nodejs.js` requires it and Babel fails.
// We can mock `@upstash/redis` directly instead.

if (!content.includes("@upstash/redis")) {
  content =
    `jest.mock("@upstash/redis", () => ({\n  Redis: class { constructor() {} }\n}));\n` + content;
  fs.writeFileSync(path, content);
}
