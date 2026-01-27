"use strict";
/**
 * API Change Detection Service
 * Detects when routes change and flags documentation updates needed
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
exports.detectAPIChanges = detectAPIChanges;
exports.generateChangeReport = generateChangeReport;
exports.saveChangeReport = saveChangeReport;
const fs = __importStar(require("fs/promises"));
const logger_1 = require("../../utils/logger");
const doc_generator_1 = require("./doc-generator");
/**
 * Detect API changes by comparing current routes with last known state
 * This is a simplified version - in production, you'd store last state in DB/file
 */
async function detectAPIChanges(lastKnownRoutes) {
    try {
        const currentRoutes = await (0, doc_generator_1.generateRouteDocs)();
        const lastRoutes = lastKnownRoutes || [];
        const changes = [];
        // Create maps for easy lookup
        const currentMap = new Map();
        for (const route of currentRoutes.routes) {
            const key = `${route.method}:${route.path}`;
            currentMap.set(key, route);
        }
        const lastMap = new Map();
        for (const route of lastRoutes) {
            const key = `${route.method}:${route.path}`;
            lastMap.set(key, route);
        }
        // Find added routes
        for (const [key, route] of currentMap.entries()) {
            if (!route)
                continue;
            if (!lastMap.has(key)) {
                changes.push({
                    type: "added",
                    route: route.path,
                    method: route.method,
                    changes: ["New route added"],
                    docsNeeded: !route.description,
                    file: route.file,
                });
            }
            else {
                // Check for modifications
                const lastRoute = lastMap.get(key);
                if (!lastRoute)
                    continue;
                const modifications = [];
                if (route.description !== lastRoute.description) {
                    modifications.push("Description changed");
                }
                if (route.auth !== lastRoute.auth) {
                    modifications.push(`Auth requirement changed: ${lastRoute.auth} → ${route.auth}`);
                }
                if (JSON.stringify(route.permissions?.sort()) !==
                    JSON.stringify(lastRoute.permissions?.sort())) {
                    modifications.push("Permissions changed");
                }
                if (route.file !== lastRoute.file) {
                    modifications.push(`File moved: ${lastRoute.file} → ${route.file}`);
                }
                if (modifications.length > 0) {
                    changes.push({
                        type: "modified",
                        route: route.path,
                        method: route.method,
                        changes: modifications,
                        docsNeeded: modifications.some((m) => m.includes("Description")) || !route.description,
                        file: route.file,
                    });
                }
            }
        }
        // Find removed routes
        for (const [key, route] of lastMap.entries()) {
            if (!currentMap.has(key)) {
                if (!route)
                    continue;
                changes.push({
                    type: "removed",
                    route: route.path,
                    method: route.method,
                    changes: ["Route removed"],
                    docsNeeded: true,
                    file: route.file,
                });
            }
        }
        const totalAdded = changes.filter((c) => c.type === "added").length;
        const totalModified = changes.filter((c) => c.type === "modified").length;
        const totalRemoved = changes.filter((c) => c.type === "removed").length;
        const documentationNeeded = changes.filter((c) => c.docsNeeded).length;
        return {
            detectedAt: new Date(),
            changes,
            totalAdded,
            totalModified,
            totalRemoved,
            documentationNeeded,
        };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to detect API changes", error);
        return {
            detectedAt: new Date(),
            changes: [],
            totalAdded: 0,
            totalModified: 0,
            totalRemoved: 0,
            documentationNeeded: 0,
        };
    }
}
/**
 * Generate a summary report of API changes
 */
async function generateChangeReport(report) {
    const lines = [];
    lines.push("# API Change Detection Report");
    lines.push("");
    lines.push(`**Detected At:** ${report.detectedAt.toISOString()}`);
    lines.push("");
    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Added:** ${report.totalAdded}`);
    lines.push(`- **Modified:** ${report.totalModified}`);
    lines.push(`- **Removed:** ${report.totalRemoved}`);
    lines.push(`- **Documentation Needed:** ${report.documentationNeeded}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    if (report.changes.length === 0) {
        lines.push("No changes detected.");
        return lines.join("\n");
    }
    // Group by type
    const byType = {
        added: [],
        modified: [],
        removed: [],
    };
    for (const change of report.changes) {
        if (change && change.type) {
            const typeKey = change.type;
            if (byType[typeKey]) {
                byType[typeKey].push(change);
            }
        }
    }
    for (const type of ["added", "modified", "removed"]) {
        const changes = byType[type];
        if (!changes || changes.length === 0)
            continue;
        lines.push(`## ${type.toUpperCase()} Routes`);
        lines.push("");
        for (const change of changes) {
            if (!change)
                continue;
            lines.push(`### ${change.method} ${change.route}`);
            lines.push("");
            if (change.file) {
                lines.push(`**File:** \`${change.file}\``);
                lines.push("");
            }
            lines.push("**Changes:**");
            for (const changeDesc of change.changes) {
                lines.push(`- ${changeDesc}`);
            }
            lines.push("");
            if (change.docsNeeded) {
                lines.push("⚠️ **Documentation update needed**");
                lines.push("");
            }
            lines.push("---");
            lines.push("");
        }
    }
    return lines.join("\n");
}
/**
 * Save change report to file
 */
async function saveChangeReport(outputPath, report) {
    try {
        const markdown = await generateChangeReport(report);
        await fs.writeFile(outputPath, markdown, "utf-8");
        (0, logger_1.logInfo)("API change report saved", {
            outputPath,
            totalChanges: report.changes.length,
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to save change report", error);
        throw error;
    }
}
//# sourceMappingURL=api-change-detector.js.map