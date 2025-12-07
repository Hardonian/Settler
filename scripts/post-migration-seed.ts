/**
 * Post-Migration Seed Script
 *
 * Seeds add-ons and initial data after migrations run.
 * This is automatically called after migrations complete.
 */

import { createClient } from "@supabase/supabase-js";
import { getAllAddOnConfigs } from "../packages/api/src/config/addon-config";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function seedAddOns() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log("⚠️  Supabase credentials not configured. Skipping seed.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("🌱 Seeding add-ons...\n");

  const configs = getAllAddOnConfigs();
  let seeded = 0;
  let skipped = 0;

  for (const config of configs) {
    try {
      const { error } = await supabase
        .from("add_ons")
        .upsert({
          integration_id: config.integration_id,
          name: config.name,
          description: config.description,
          category: config.category,
          base_price_monthly: config.base_price_monthly,
          usage_price_per_unit: config.usage_price_per_unit || null,
          usage_unit: config.usage_unit || null,
          is_standard: config.is_standard,
          is_active: true,
          metadata: config.metadata || {},
        }, {
          onConflict: "integration_id",
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - already exists
          skipped++;
          console.log(`   ⏭️  ${config.name} (already exists)`);
        } else {
          console.error(`   ❌ Failed to seed ${config.name}:`, error.message);
        }
      } else {
        seeded++;
        console.log(`   ✅ ${config.name}`);
      }
    } catch (error) {
      console.error(`   ❌ Error seeding ${config.name}:`, error);
    }
  }

  console.log(`\n✅ Seeded ${seeded} add-ons, skipped ${skipped} existing`);
}

if (require.main === module) {
  seedAddOns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { seedAddOns };
