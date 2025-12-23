"use strict";
/**
 * Receipt Auto-Matching Service
 * Automatically matches receipts to transactions during reconciliation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchReceiptsToTransactions = matchReceiptsToTransactions;
exports.verifyReceiptLink = verifyReceiptLink;
exports.getReceiptMatches = getReceiptMatches;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
/**
 * Match receipts to transactions
 */
async function matchReceiptsToTransactions(tenantId, reconciliationRunId, receipts, transactions) {
    try {
        const matches = [];
        for (const receipt of receipts) {
            let bestMatch = null;
            for (const transaction of transactions) {
                const matchResult = calculateMatch(receipt, transaction);
                if (!bestMatch ||
                    matchResult.confidenceScore > bestMatch.confidenceScore) {
                    bestMatch = {
                        transactionId: transaction.id,
                        confidence: matchResult.confidence,
                        confidenceScore: matchResult.confidenceScore,
                        matchReasons: matchResult.matchReasons,
                    };
                }
            }
            if (bestMatch && bestMatch.confidenceScore > 0.5) {
                // Create link
                await (0, db_1.query)(`INSERT INTO receipt_transaction_links (
            tenant_id, receipt_id, transaction_id, reconciliation_run_id,
            match_confidence, confidence_score, matched_at
          ) VALUES ($1, $2, $3, $4, $5, $6, now())
          ON CONFLICT DO NOTHING`, [
                    tenantId,
                    receipt.id,
                    bestMatch.transactionId,
                    reconciliationRunId,
                    bestMatch.confidence,
                    bestMatch.confidenceScore,
                ]);
                matches.push({
                    receiptId: receipt.id,
                    transactionId: bestMatch.transactionId,
                    confidence: bestMatch.confidence,
                    confidenceScore: bestMatch.confidenceScore,
                    matchReasons: bestMatch.matchReasons,
                });
            }
        }
        (0, logger_1.logInfo)("Receipts matched", {
            tenantId,
            reconciliationRunId,
            matchCount: matches.length,
        });
        return matches;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to match receipts", error, { tenantId, reconciliationRunId });
        throw error;
    }
}
/**
 * Calculate match confidence between receipt and transaction
 */
function calculateMatch(receipt, transaction) {
    let score = 0;
    const reasons = [];
    // Amount match (40% weight)
    const amountDiff = Math.abs(receipt.amount - transaction.amount);
    if (amountDiff === 0) {
        score += 0.4;
        reasons.push("exact_amount_match");
    }
    else if (amountDiff <= 0.01) {
        score += 0.35;
        reasons.push("near_exact_amount_match");
    }
    else if (amountDiff <= receipt.amount * 0.05) {
        score += 0.2;
        reasons.push("approximate_amount_match");
    }
    // Date match (30% weight)
    const dateDiff = Math.abs(receipt.date.getTime() - transaction.date.getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    if (daysDiff === 0) {
        score += 0.3;
        reasons.push("exact_date_match");
    }
    else if (daysDiff <= 1) {
        score += 0.25;
        reasons.push("near_date_match");
    }
    else if (daysDiff <= 7) {
        score += 0.15;
        reasons.push("approximate_date_match");
    }
    // Description match (30% weight)
    if (receipt.description && transaction.description) {
        const similarity = stringSimilarity(receipt.description.toLowerCase(), transaction.description.toLowerCase());
        score += similarity * 0.3;
        if (similarity > 0.8) {
            reasons.push("high_description_similarity");
        }
        else if (similarity > 0.5) {
            reasons.push("medium_description_similarity");
        }
    }
    // Vendor match bonus (10% bonus)
    if (receipt.vendor && transaction.description) {
        if (transaction.description.toLowerCase().includes(receipt.vendor.toLowerCase())) {
            score += 0.1;
            reasons.push("vendor_match");
        }
    }
    // Determine confidence level
    let confidence;
    if (score >= 0.8) {
        confidence = "high";
    }
    else if (score >= 0.6) {
        confidence = "medium";
    }
    else {
        confidence = "low";
    }
    return {
        confidence,
        confidenceScore: Math.min(1, score),
        matchReasons: reasons,
    };
}
/**
 * Simple string similarity (Jaccard-like)
 */
function stringSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}
/**
 * Verify a receipt-transaction link
 */
async function verifyReceiptLink(tenantId, linkId, verifiedBy) {
    try {
        await (0, db_1.query)(`UPDATE receipt_transaction_links
       SET verified = true, verified_by = $1, verified_at = now()
       WHERE id = $2 AND tenant_id = $3`, [verifiedBy, linkId, tenantId]);
        (0, logger_1.logInfo)("Receipt link verified", { linkId, tenantId, verifiedBy });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to verify receipt link", error, { linkId, tenantId });
        throw error;
    }
}
/**
 * Get receipt matches for a reconciliation run
 */
async function getReceiptMatches(tenantId, reconciliationRunId) {
    try {
        const result = await (0, db_1.query)(`SELECT id, receipt_id, transaction_id, match_confidence, confidence_score, verified
       FROM receipt_transaction_links
       WHERE tenant_id = $1 AND reconciliation_run_id = $2
       ORDER BY confidence_score DESC`, [tenantId, reconciliationRunId]);
        return result.map((row) => ({
            id: row.id,
            receiptId: row.receipt_id,
            transactionId: row.transaction_id,
            confidence: row.match_confidence,
            confidenceScore: row.confidence_score,
            verified: row.verified,
        }));
    }
    catch (error) {
        (0, logger_1.logError)("Failed to get receipt matches", error, { tenantId, reconciliationRunId });
        throw error;
    }
}
//# sourceMappingURL=receipt-matching.js.map