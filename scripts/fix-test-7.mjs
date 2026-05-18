import fs from 'fs';

let path = 'packages/web/jest.config.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('uncrypto')) {
    content = content.replace("moduleNameMapper: {", "moduleNameMapper: {\n    '^uncrypto$': require.resolve('crypto'),");
    fs.writeFileSync(path, content);
}
