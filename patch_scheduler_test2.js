const fs = require('fs');
const file = 'packages/api/src/infrastructure/__tests__/MaterializedViewScheduler.test.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
    'import * as manager from "../MaterializedViewManager";',
    ''
);
code = code.replace(
    'console.log(`Cleanup took ${endTime - startTime} ms`);',
    'console.info(`Cleanup took ${endTime - startTime} ms`);'
);
code = code.replace(
    'console.log(`query was called ${mockQuery.mock.calls.length} times`);',
    'console.info(`query was called ${mockQuery.mock.calls.length} times`);'
);

fs.writeFileSync(file, code);
