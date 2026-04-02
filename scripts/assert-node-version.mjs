#!/usr/bin/env node

import nodeContract from "./node-version-contract.cjs";

nodeContract.assertSupportedNodeVersion("Node/runtime gate");

const { requiredVersion, requiredRange } = nodeContract.formatNodeRequirement();
console.log(
  `✅ Node runtime OK (${process.version}; required ${requiredVersion}, ${requiredRange})`
);
