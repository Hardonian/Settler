const fs = require("fs");

function replaceFile(file, replacer) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, "utf8");
    code = replacer(code);
    fs.writeFileSync(file, code);
  }
}

replaceFile("packages/web/src/__tests__/api/stripe-webhook-runtime.test.ts", (code) => {
  return code
    .replace(
      /expect\(source\)\.toContain\("export const runtime = 'nodejs'"\);/,
      "expect(source).toMatch(/export const runtime = ['\"]nodejs['\"]/);"
    )
    .replace(
      /expect\(source\)\.toContain\("const rawBody = await request\.text\(\);"\);/,
      "expect(source).toMatch(/const rawBody = await request.text\\(\\);/);"
    )
    .replace(
      /expect\(source\)\.toContain\("createHmac\\('sha256'\\)"\);/,
      "expect(source).toMatch(/createHmac\\(['\"]sha256['\"]\\)/);"
    );
});

replaceFile("packages/web/src/__tests__/api/status-degraded-contract.test.ts", (code) => {
  return code
    .replace(
      /expect\(source\)\.toContain\("status: 'degraded'"\);/,
      "expect(source).toMatch(/status:\\s*['\"]degraded['\"]/);"
    )
    .replace(
      /expect\(source\)\.toContain\("healthy: false"\);/,
      "expect(source).toMatch(/healthy:\\s*false/);"
    )
    .replace(
      /expect\(source\)\.toContain\("error: 'Unable to complete health probe'"\);/,
      "expect(source).toMatch(/error:\\s*['\"]Unable to complete health probe['\"]/);"
    );
});

replaceFile("packages/web/src/__tests__/api/status-no-self-hop.test.ts", (code) => {
  return code.replace(
    /expect\(source\)\.toContain\("checkApplicationRuntimeHealth"\);/,
    "expect(source).toMatch(/probeRuntimeConnectivityHealth/);"
  );
});
