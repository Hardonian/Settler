#!/usr/bin/env node
import { createClient } from "tigerbeetle-node";

const [operation, rawId, rawAddresses] = process.argv.slice(2);
if (!operation || !rawId || !rawAddresses || !["create", "lookup"].includes(operation)) {
  console.error(
    "Usage: tigerbeetle-cluster-smoke.mjs <create|lookup> <account-id> <comma-separated-addresses>"
  );
  process.exit(2);
}

const id = BigInt(rawId);
const client = createClient({
  cluster_id: 0n,
  replica_addresses: rawAddresses.split(","),
});

try {
  if (operation === "create") {
    await client.createAccounts([
      {
        id,
        debits_pending: 0n,
        debits_posted: 0n,
        credits_pending: 0n,
        credits_posted: 0n,
        user_data_128: 0n,
        user_data_64: 0n,
        user_data_32: 0,
        reserved: 0,
        ledger: 1,
        code: 1,
        flags: 0,
        timestamp: 0n,
      },
    ]);
  }

  const accounts = await client.lookupAccounts([id]);
  const found = accounts.some((account) => account.id === id);
  if (operation === "create" && !found) {
    throw new Error(`Account ${id} was not visible after creation`);
  }
  if (operation === "lookup" && !found) {
    throw new Error(`Account ${id} was not found`);
  }
  console.log(`TigerBeetle ${operation} verified for account ${id}`);
} finally {
  client.destroy();
}
