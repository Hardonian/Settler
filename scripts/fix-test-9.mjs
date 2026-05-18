import fs from 'fs';

let path = 'packages/web/jest.config.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/'\^uncrypto\$': require\.resolve\('crypto'\),/, "'^uncrypto$': require.resolve('uncrypto'),");
fs.writeFileSync(path, content);
