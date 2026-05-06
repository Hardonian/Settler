import re

with open("packages/api/src/services/ops-intelligence/insights-engine.ts", "r") as f:
    content = f.read()

search = """        const activeSubTenants = new Set<string>();

        if (candidateTenantIds.length > 0) {
          try {
            // Single batch query for active subscriptions mapped to tenant_ids
            const { data: activeBilling } = await supabase
              .from("billing_accounts")
              .select("tenant_id, subscriptions!inner(status)")
              .in("tenant_id", candidateTenantIds)
              .eq("subscriptions.status", "active");

            if (activeBilling) {
              for (const record of activeBilling) {
                if (record.tenant_id) {
                  activeSubTenants.add(record.tenant_id);
                }
              }
            }
          } catch (_error) {
            // Ignore error and fall back to cost > 500 check only
          }
        }

        for (const [tenantId, cost] of orgCostMap.entries()) {
          if (cost > 100) {
            const hasActiveSub = activeSubTenants.has(tenantId);
            if (!hasActiveSub || cost > 500) {
              highCostLowRevOrgs.push(tenantId);
              if (highCostLowRevOrgs.length >= 10) break; // Limit results
            }
          }
        }"""

replace = """        let queryFailed = false;
        const activeSubTenants = new Set<string>();

        // Chunk to avoid 414 URI Too Long errors
        const MAX_CHUNK_SIZE = 50;

        for (let i = 0; i < candidateTenantIds.length; i += MAX_CHUNK_SIZE) {
          const chunk = candidateTenantIds.slice(i, i + MAX_CHUNK_SIZE);
          try {
            // Single batch query for active subscriptions mapped to tenant_ids
            const { data: activeBilling } = await supabase
              .from("billing_accounts")
              .select("tenant_id, subscriptions!inner(status)")
              .in("tenant_id", chunk)
              .eq("subscriptions.status", "active");

            if (activeBilling) {
              for (const record of activeBilling) {
                if (record.tenant_id) {
                  activeSubTenants.add(record.tenant_id);
                }
              }
            }
          } catch (_error) {
            queryFailed = true;
            break; // Stop querying if the DB is failing
          }
        }

        for (const [tenantId, cost] of orgCostMap.entries()) {
          if (cost > 100) {
            if (queryFailed) {
              // If subscription check fails, fall back to high-cost orgs
              if (cost > 500) {
                highCostLowRevOrgs.push(tenantId);
                if (highCostLowRevOrgs.length >= 10) break;
              }
            } else {
              const hasActiveSub = activeSubTenants.has(tenantId);
              if (!hasActiveSub || cost > 500) {
                highCostLowRevOrgs.push(tenantId);
                if (highCostLowRevOrgs.length >= 10) break; // Limit results
              }
            }
          }
        }"""

new_content = content.replace(search, replace)
if content == new_content:
    print("Failed to replace string")
else:
    with open("packages/api/src/services/ops-intelligence/insights-engine.ts", "w") as f:
        f.write(new_content)
    print("Successfully replaced string")
