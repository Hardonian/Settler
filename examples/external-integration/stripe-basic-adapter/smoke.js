#!/usr/bin/env node

const payload = {
  adapter: "stripe-basic-adapter",
  eventType: "payment.succeeded",
  amount: 1099,
  currency: "usd",
};

if (payload.adapter !== "stripe-basic-adapter") {
  console.error("adapter mismatch");
  process.exit(1);
}

console.log("adapter:", payload.adapter);
console.log("fixture:", JSON.stringify(payload));
console.log("result: ok");
