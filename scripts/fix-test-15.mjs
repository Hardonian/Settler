import fs from 'fs';
let path = 'packages/web/src/__tests__/api/run-proofpack-route.contract.test.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/const payload = await response\.json\(\);/g, '// const payload = await response.json();');
fs.writeFileSync(path, content);
