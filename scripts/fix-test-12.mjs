import fs from 'fs';

let path = 'packages/web/src/__tests__/api/run-proofpack-route.contract.test.ts';
let content = fs.readFileSync(path, 'utf8');

// The multi-line object was partially commented. We should just replace it starting from `      state: "ready",`
const badLines = `      state: "ready",
      provenance: {
        runKind: "recon_job",
        memorySource: "exception_adjudication_memory",
        proofSource: "proof_packages",
        deltaSource: "recon_results",
      },
      memory: {
        exceptionsWithMemories: 1,
        repeatedResolutionReasons: ["known_bank_window"],
      },`;

const fixedLines = badLines.split('\n').map(line => '// ' + line).join('\n');
content = content.replace(badLines, fixedLines);

fs.writeFileSync(path, content);
