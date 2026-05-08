const fs = require('fs');

function replaceFile(file, replacer) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = replacer(code);
    fs.writeFileSync(file, code);
  }
}

replaceFile('packages/web/src/__tests__/api/run-proofpack-route.contract.test.ts', code => {
  return code.replace(/expect\(response\.status\)\.toBe\(200\);/, 'expect(response.status).toBe(200); // Wait what is this');
});
