"use strict";
/**
 * Supabase Configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseConfig = void 0;
const index_1 = require("./index");
exports.supabaseConfig = {
    url: process.env.SUPABASE_URL || index_1.config.database.host,
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    // Realtime configuration
    realtime: {
        eventsPerSecond: parseInt(process.env.SUPABASE_REALTIME_EVENTS_PER_SECOND || '10'),
    },
    // Database configuration
    db: {
        schema: 'public',
        useConnectionPooling: true,
    },
};
//# sourceMappingURL=supabase.js.map