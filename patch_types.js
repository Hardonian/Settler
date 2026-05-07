const fs = require("fs");
const file = "packages/types/src/index.ts";
let content = fs.readFileSync(file, "utf8");

// Replace all "} from './xxx';" with "} from './xxx.js';"
content = content.replace(/\} from "\.\/([^"]+)"/g, '} from "./$1.js"');

fs.writeFileSync(file, content);
