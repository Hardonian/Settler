const fs = require("fs");

const file1 = "packages/adapters/src/alerting/alert-manager.ts";
let content1 = fs.readFileSync(file1, "utf8");
content1 = content1.replace(
  'const { notificationService } = await import("./notification-service");',
  'const { notificationService } = await import("./notification-service.js");'
);
fs.writeFileSync(file1, content1);
