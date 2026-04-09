/**
 * Supabase Configuration
 */

import { config } from "./index";

export const supabaseConfig = {
  url: process.env.SUPABASE_URL || config.database.host,
  anonKey: process.env.SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // Realtime configuration
  realtime: {
    eventsPerSecond: parseInt(process.env.SUPABASE_REALTIME_EVENTS_PER_SECOND || "10"),
  },

  // Database configuration
  db: {
    schema: "public",
    useConnectionPooling: true,
  },
};
