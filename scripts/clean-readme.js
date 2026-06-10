const fs = require("fs");

const readmePath = "README.md";
let content = fs.readFileSync(readmePath, "utf8");

content = content.replace(/\bsupports\b/g, "handles");
content = content.replace(/\bSupports\b/g, "Handles");

content = content.replace(/\bprovides\b/g, "delivers");
content = content.replace(/\bProvides\b/g, "Delivers");

content = content.replace(/\bincludes\b/g, "contains");
content = content.replace(/\bIncludes\b/g, "Contains");

content = content.replace(/\bfeatures\b/g, "capabilities");
content = content.replace(/\bFeatures\b/g, "Capabilities");

content = content.replace(/\benables\b/g, "allows");
content = content.replace(/\bEnables\b/g, "Allows");

fs.writeFileSync(readmePath, content);
console.log("Cleaned README.md pipe dreams");
