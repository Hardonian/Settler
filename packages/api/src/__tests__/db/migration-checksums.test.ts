import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(__dirname, "../../db/migrations");

const EXPECTED_MIGRATION_SHA256: Record<string, string> = {
  "001-initial-schema.sql": "564d61c681f1d13872969a925749d6df26accdee0c076179d1b6f9955c0a96c0",
  "002-strategic-initiatives.sql": "2ebb645cf3d2eb09c4768adcd0d6bc5d8336e458e4ec8d0db60d773078afe5af",
  "003-canonical-data-model.sql": "4339c39f9598e22455af80be0ad25191db201f5eb3d7804eb017f719828824dc",
  "004-events-tracking.sql": "eabdca00c27aeff05a78f403b5199a07d2dd458edbb1d81d9dcff7a1ec3cffe6",
  "005-feedback-system.sql": "cc4bb621a23d43cf73faa7ccfaf800b0c816111170654f668ddb58130497eec0",
  "006-alerts-system.sql": "b794406566c93fd005a14d32e2e68b7f46741b1cf9727b0c91628c35c581e8f3",
  "007-test-mode-column.sql": "74101d9dd7d7c9144aeb3da19b61b8fe592c3016c86cee24895435ccde003bbb",
  "008-audit-logs.sql": "4a3af9e745953a798df7454acf839b0985ecc8298b8fc4ccbb29a7aeb9c804c0",
  "009-refresh-tokens.sql": "030063f65c43b5ef789775b5fb3113f753070cc6192e301347c94ab2ed91ae6a",
  "cqrs-projections.sql": "39f1c8c7db37275cb17c012864cd6fe92634469d6178c0b44342142e7291cb36",
  "event-sourcing.sql": "ee6a18b0555c866cf3ceb1b3a22dc918cf506a1a55d0ca45990e86f015992bda",
  "materialized-views.sql": "e82c8c2f6725893cb1ffcfa6813b432b1f7a0d5784945b9a8ae0187bd5dd57df",
  "multi-tenancy.sql": "f1857aebfe6430c583511c2729c110f883ab95371ce6daae25b6356abdf12293",
  "performance-indexes.sql": "0a7f6a7dc4e648540e96253ba5bbbcd148de78af5362a34ee526ea77a73394d2",
  "security.sql": "b595a64a646189649dfef0e39337c3e9fccdaae74030c136cbcf7dca431b3eea",
  "table-partitions.sql": "2313fe12ed91b6e68b065032e73f48cda932cba504b187ad8b9529257ddc32e5",
};

describe("Migration immutability checksums", () => {
  it("preserves historical migration file content", () => {
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.endsWith(".sql"))
      .sort();

    expect(migrationFiles).toEqual(Object.keys(EXPECTED_MIGRATION_SHA256).sort());

    for (const fileName of migrationFiles) {
      const filePath = path.join(MIGRATIONS_DIR, fileName);
      const actualChecksum = createHash("sha256")
        .update(fs.readFileSync(filePath, "utf8"))
        .digest("hex");

      expect(actualChecksum).toBe(EXPECTED_MIGRATION_SHA256[fileName]);
    }
  });
});
