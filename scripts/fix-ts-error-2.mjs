import fs from "fs";
let path = "packages/web/src/shared/db/prismaClient.ts";
let content = fs.readFileSync(path, "utf8");

// The error is `error.message` because `error` is `unknown` in catch block.
content = content.replace(/error\.message/g, "(error as Error).message");

fs.writeFileSync(path, content);
