"use strict";
/**
 * Demo Adapter
 *
 * Stub adapter that returns deterministic demo data
 * without making external API calls.
 *
 * Used when DEMO_MODE=true to enable self-contained demonstrations.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoBankAdapter = exports.DemoStripeAdapter = void 0;
exports.isDemoMode = isDemoMode;
exports.getDemoAdapter = getDemoAdapter;
exports.getAvailableAdapters = getAvailableAdapters;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEMO_DATA_DIR = path.join(process.cwd(), "demo/data");
function loadDemoData(source) {
    const fileName = source === "stripe" ? "demo_stripe_transactions.json" : "demo_bank_transactions.json";
    const filePath = path.join(DEMO_DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Demo data not found: ${filePath}. Run 'npx tsx scripts/seed-demo.ts' first.`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
}
function demoRecordToNormalized(record) {
    return {
        id: record.id,
        amount: record.amount,
        currency: record.currency,
        date: new Date(record.date),
        metadata: {
            externalId: record.externalId,
            type: record.type,
            status: record.status,
            description: record.description,
        },
        sourceId: record.externalId,
        referenceId: undefined,
    };
}
class DemoStripeAdapter {
    name = "demo-stripe";
    version = "1.0.0";
    async fetch(options) {
        const records = loadDemoData("stripe");
        let filtered = records.filter((r) => {
            const recordDate = new Date(r.date);
            return recordDate >= options.dateRange.start && recordDate <= options.dateRange.end;
        });
        if (options.config?.types) {
            const types = options.config.types;
            filtered = filtered.filter((r) => types.includes(r.type));
        }
        return filtered.map(demoRecordToNormalized);
    }
    normalize(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Invalid demo data: expected object");
        }
        const record = data;
        return demoRecordToNormalized(record);
    }
    validate(data) {
        const errors = [];
        if (!data.id)
            errors.push("Missing id");
        if (typeof data.amount !== "number")
            errors.push("Invalid amount");
        if (!data.currency)
            errors.push("Missing currency");
        if (!data.date || !(data.date instanceof Date))
            errors.push("Invalid date");
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
}
exports.DemoStripeAdapter = DemoStripeAdapter;
class DemoBankAdapter {
    name = "demo-bank";
    version = "1.0.0";
    async fetch(options) {
        const records = loadDemoData("bank");
        let filtered = records.filter((r) => {
            const recordDate = new Date(r.date);
            return recordDate >= options.dateRange.start && recordDate <= options.dateRange.end;
        });
        return filtered.map(demoRecordToNormalized);
    }
    normalize(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Invalid demo data: expected object");
        }
        const record = data;
        return demoRecordToNormalized(record);
    }
    validate(data) {
        const errors = [];
        if (!data.id)
            errors.push("Missing id");
        if (typeof data.amount !== "number")
            errors.push("Invalid amount");
        if (!data.currency)
            errors.push("Missing currency");
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
}
exports.DemoBankAdapter = DemoBankAdapter;
function isDemoMode() {
    return process.env.DEMO_MODE === "true";
}
function getDemoAdapter(type) {
    if (type === "stripe") {
        return new DemoStripeAdapter();
    }
    return new DemoBankAdapter();
}
function getAvailableAdapters() {
    return [new DemoStripeAdapter(), new DemoBankAdapter()];
}
//# sourceMappingURL=demo.js.map