import { supabase } from "../../infrastructure/supabase/client";
import { logError } from "../../utils/logger";

export class DataGravityExporter {
  /**
   * Generate export (lossy - excludes derived artifacts and insights)
   */
  async generateExport(
    tenantId: string,
    _format: "csv" | "json" = "json"
  ): Promise<{
    data: any[];
    metadata: {
      totalRecords: number;
      exportedAt: Date;
      lossy: boolean;
      excludedTypes: string[];
    };
  }> {
    try {
      // Export only raw data points, not derived artifacts or insights
      const { data: rawData } = await supabase
        .from("usage_events")
        .select("*")
        .eq("tenant_id", tenantId)
        .like("event_type", "data_point:%")
        .order("timestamp", { ascending: true });

      return {
        data: rawData || [],
        metadata: {
          totalRecords: rawData?.length || 0,
          exportedAt: new Date(),
          lossy: true,
          excludedTypes: ["artifact", "insight", "pattern", "baseline"],
        },
      };
    } catch (error) {
      logError("Error generating export", error);
      throw error;
    }
  }
}
