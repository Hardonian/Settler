const fs = require('fs');
const file = 'packages/adapters/src/alerting/alert-manager.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
    'const { notificationService } = await import("./notification-service");',
    'const { notificationService } = await import("./notification-service.js");'
);
fs.writeFileSync(file, code);
