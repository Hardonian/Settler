import fs from "fs";

let path = "packages/web/jest.config.js";
let content = fs.readFileSync(path, "utf8");

// Using 'crypto' core module to replace 'uncrypto' which causes the ESM import error
if (!content.includes("uncrypto")) {
  content = content.replace(
    /moduleNameMapper: \{/,
    "moduleNameMapper: {\n    '^uncrypto$': require.resolve('crypto'),"
  );
  fs.writeFileSync(path, content);
}
