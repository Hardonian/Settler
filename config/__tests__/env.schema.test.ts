import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateEnvVar, EnvVarSpec } from "../env.schema";

describe("validateEnvVar", () => {
  const baseSpec: EnvVarSpec = {
    name: "TEST_VAR",
    description: "A test variable",
    type: "string",
    required: false,
    scope: "runtime",
    exposure: "server-only",
    criticality: "optional",
    environments: ["production"],
    secret: false,
    platforms: ["local"],
  };

  it("should return valid for optional unset variables", () => {
    const result = validateEnvVar(baseSpec, "");
    assert.equal(result.valid, true);
  });

  it("should return invalid for required unset variables", () => {
    const spec = { ...baseSpec, required: true };
    const result = validateEnvVar(spec, "");
    assert.equal(result.valid, false);
    assert.equal(result.error, "TEST_VAR is required but not set");
  });

  it("should return valid for unset variables with a default value", () => {
    const spec = { ...baseSpec, required: true, defaultValue: "default" };
    const result = validateEnvVar(spec, "");
    assert.equal(result.valid, true);
  });

  it("should validate numbers correctly", () => {
    const spec = { ...baseSpec, type: "number" as const };
    assert.equal(validateEnvVar(spec, "123").valid, true);
    assert.equal(validateEnvVar(spec, "abc").valid, false);
    assert.equal(validateEnvVar(spec, "abc").error, "TEST_VAR must be a number");
  });

  it("should validate booleans correctly", () => {
    const spec = { ...baseSpec, type: "boolean" as const };
    assert.equal(validateEnvVar(spec, "true").valid, true);
    assert.equal(validateEnvVar(spec, "false").valid, true);
    assert.equal(validateEnvVar(spec, "1").valid, true);
    assert.equal(validateEnvVar(spec, "0").valid, true);

    assert.equal(validateEnvVar(spec, "yes").valid, false);
    assert.equal(validateEnvVar(spec, "yes").error, "TEST_VAR must be a boolean (true/false)");
  });

  it("should validate URLs correctly", () => {
    const spec = { ...baseSpec, type: "url" as const };
    assert.equal(validateEnvVar(spec, "https://example.com").valid, true);
    assert.equal(validateEnvVar(spec, "http://localhost:3000").valid, true);

    assert.equal(validateEnvVar(spec, "not-a-url").valid, false);
    assert.equal(validateEnvVar(spec, "not-a-url").error, "TEST_VAR must be a valid URL");
  });

  it("should validate ports correctly", () => {
    const spec = { ...baseSpec, type: "port" as const };
    assert.equal(validateEnvVar(spec, "8080").valid, true);
    assert.equal(validateEnvVar(spec, "1").valid, true);
    assert.equal(validateEnvVar(spec, "65535").valid, true);

    assert.equal(validateEnvVar(spec, "0").valid, false);
    assert.equal(validateEnvVar(spec, "65536").valid, false);
    assert.equal(validateEnvVar(spec, "abc").valid, false);
    assert.equal(validateEnvVar(spec, "65536").error, "TEST_VAR must be a valid port (1-65535)");
  });

  it("should run custom validators", () => {
    const spec = {
      ...baseSpec,
      validator: (v: string) => v.startsWith("VALID_"),
    };
    assert.equal(validateEnvVar(spec, "VALID_VALUE").valid, true);
    assert.equal(validateEnvVar(spec, "INVALID_VALUE").valid, false);
    assert.equal(validateEnvVar(spec, "INVALID_VALUE").error, "TEST_VAR failed custom validation");
  });
});
