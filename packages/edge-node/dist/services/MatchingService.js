"use strict";
/**
 * Matching Service
 * Performs local fuzzy matching and candidate scoring using optimized models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchingService = void 0;
const logger_1 = require("../utils/logger");
class MatchingService {
    _db;
    _modelManager;
    constructor(
    // @ts-expect-error - Reserved for future use
    _db, 
    // @ts-expect-error - Reserved for future use
    _modelManager) {
        this._db = _db;
        this._modelManager = _modelManager;
    }
    async findCandidates(sourceData, targetData) {
        logger_1.logger.info("Finding candidates", {
            sourceCount: sourceData.length,
            targetCount: targetData.length,
        });
        const candidates = [];
        // Simple fuzzy matching (can be enhanced with ML models)
        for (const source of sourceData) {
            if (typeof source !== "object" || source === null)
                continue;
            const sourceRecord = source;
            const sourceId = this.extractId(sourceRecord);
            for (const target of targetData) {
                if (typeof target !== "object" || target === null)
                    continue;
                const targetRecord = target;
                const targetId = this.extractId(targetRecord);
                const score = this.calculateMatchScore(sourceRecord, targetRecord);
                if (score > 0.5) {
                    // Threshold for candidate
                    candidates.push({
                        sourceId,
                        targetId,
                        confidenceScore: score,
                        scoreMatrix: {
                            amount: this.compareAmount(sourceRecord, targetRecord),
                            date: this.compareDate(sourceRecord, targetRecord),
                            description: this.compareString(sourceRecord, targetRecord, "description"),
                        },
                    });
                }
            }
        }
        // Sort by confidence score
        candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
        // Limit to top candidates
        return candidates.slice(0, 100);
    }
    extractId(record) {
        return String(record.id || record.transaction_id || record.order_id || "");
    }
    calculateMatchScore(source, target) {
        let totalScore = 0;
        let weightSum = 0;
        // Amount matching (high weight)
        const amountScore = this.compareAmount(source, target);
        totalScore += amountScore * 0.4;
        weightSum += 0.4;
        // Date matching (medium weight)
        const dateScore = this.compareDate(source, target);
        totalScore += dateScore * 0.3;
        weightSum += 0.3;
        // Description/ID matching (medium weight)
        const descScore = this.compareString(source, target, "description") || this.compareString(source, target, "id");
        totalScore += descScore * 0.3;
        weightSum += 0.3;
        return weightSum > 0 ? totalScore / weightSum : 0;
    }
    compareAmount(source, target) {
        const sourceAmount = this.extractAmount(source);
        const targetAmount = this.extractAmount(target);
        if (sourceAmount === null || targetAmount === null) {
            return 0;
        }
        const diff = Math.abs(sourceAmount - targetAmount);
        const maxAmount = Math.max(Math.abs(sourceAmount), Math.abs(targetAmount));
        if (maxAmount === 0) {
            return sourceAmount === targetAmount ? 1 : 0;
        }
        // Exact match = 1.0, 1% difference = 0.9, etc.
        return Math.max(0, 1 - diff / maxAmount);
    }
    extractAmount(record) {
        const amount = record.amount || record.total || record.value;
        if (typeof amount === "number") {
            return amount;
        }
        if (typeof amount === "string") {
            const parsed = parseFloat(amount.replace(/[^0-9.-]/g, ""));
            return isNaN(parsed) ? null : parsed;
        }
        return null;
    }
    compareDate(source, target) {
        const sourceDate = this.extractDate(source);
        const targetDate = this.extractDate(target);
        if (!sourceDate || !targetDate) {
            return 0;
        }
        const diffMs = Math.abs(sourceDate.getTime() - targetDate.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        // Same day = 1.0, 1 day difference = 0.9, 7 days = 0.3, etc.
        return Math.max(0, 1 - diffDays / 7);
    }
    extractDate(record) {
        const dateField = record.date || record.timestamp || record.created_at;
        if (dateField instanceof Date) {
            return dateField;
        }
        if (typeof dateField === "string") {
            const parsed = new Date(dateField);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        if (typeof dateField === "number") {
            return new Date(dateField);
        }
        return null;
    }
    compareString(source, target, field) {
        const sourceValue = String(source[field] || "").toLowerCase();
        const targetValue = String(target[field] || "").toLowerCase();
        if (!sourceValue || !targetValue) {
            return 0;
        }
        // Simple Levenshtein-like similarity
        if (sourceValue === targetValue) {
            return 1.0;
        }
        if (sourceValue.includes(targetValue) || targetValue.includes(sourceValue)) {
            return 0.8;
        }
        // Calculate simple similarity
        const longer = sourceValue.length > targetValue.length ? sourceValue : targetValue;
        if (longer.length === 0) {
            return 1.0;
        }
        const editDistance = this.levenshteinDistance(sourceValue, targetValue);
        return 1 - editDistance / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            if (!matrix[0]) {
                matrix[0] = [];
            }
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            if (!matrix[i]) {
                matrix[i] = [];
            }
            for (let j = 1; j <= str1.length; j++) {
                const prevI = i - 1;
                const prevJ = j - 1;
                const prevRow = matrix[prevI];
                const currRow = matrix[i];
                if (!prevRow || !currRow) {
                    throw new Error("Matrix initialization error");
                }
                if (str2.charAt(prevI) === str1.charAt(prevJ)) {
                    currRow[j] = prevRow[prevJ] ?? 0;
                }
                else {
                    currRow[j] = Math.min((prevRow[prevJ] ?? 0) + 1, (currRow[prevJ] ?? 0) + 1, (prevRow[j] ?? 0) + 1);
                }
            }
        }
        const finalRow = matrix[str2.length];
        return finalRow?.[str1.length] ?? 0;
    }
}
exports.MatchingService = MatchingService;
//# sourceMappingURL=MatchingService.js.map