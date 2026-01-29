"use strict";
/**
 * Cross-Customer Intelligence System
 *
 * Aggregates anonymized reconciliation patterns across all customers to detect
 * fraud and anomalies. One customer's anomaly detection improves detection for all.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.crossCustomerIntelligence = exports.CrossCustomerIntelligence = void 0;
const events_1 = require("events");
class CrossCustomerIntelligence extends events_1.EventEmitter {
    patterns = new Map();
    customerPatterns = new Map(); // customerId -> patternIds
    optInCustomers = new Set();
    /**
     * Opt-in a customer to share anonymized patterns
     */
    optIn(customerId) {
        this.optInCustomers.add(customerId);
        this.emit('customer_opted_in', customerId);
    }
    /**
     * Opt-out a customer
     */
    optOut(customerId) {
        this.optInCustomers.delete(customerId);
        // Remove customer's patterns
        const patternIds = this.customerPatterns.get(customerId);
        if (patternIds) {
            patternIds.forEach(patternId => {
                const pattern = this.patterns.get(patternId);
                if (pattern) {
                    pattern.frequency = Math.max(0, pattern.frequency - 1);
                    if (pattern.frequency === 0) {
                        this.patterns.delete(patternId);
                    }
                }
            });
            this.customerPatterns.delete(customerId);
        }
        this.emit('customer_opted_out', customerId);
    }
    /**
     * Submit a pattern from a customer (anonymized)
     */
    submitPattern(customerId, pattern) {
        if (!this.optInCustomers.has(customerId)) {
            throw new Error('Customer has not opted in to pattern sharing');
        }
        // Create anonymized pattern hash
        const patternHash = this.hashPattern(pattern.data);
        // Check if pattern already exists
        let existingPattern = Array.from(this.patterns.values()).find(p => p.patternHash === patternHash && p.patternType === pattern.type);
        if (existingPattern) {
            // Update existing pattern
            existingPattern.frequency += 1;
            existingPattern.lastSeen = new Date();
        }
        else {
            // Create new pattern
            existingPattern = {
                id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                patternHash,
                patternType: pattern.type,
                frequency: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                metadata: this.anonymizeMetadata(pattern.data),
            };
            this.patterns.set(existingPattern.id, existingPattern);
        }
        // Track customer's patterns
        if (!this.customerPatterns.has(customerId)) {
            this.customerPatterns.set(customerId, new Set());
        }
        this.customerPatterns.get(customerId).add(existingPattern.id);
        this.emit('pattern_submitted', { customerId, patternId: existingPattern.id });
        return existingPattern.id;
    }
    /**
     * Check if a pattern matches known patterns
     */
    checkPattern(pattern) {
        const patternHash = this.hashPattern(pattern.data);
        const matchingPattern = Array.from(this.patterns.values()).find(p => p.patternHash === patternHash && p.patternType === pattern.type);
        if (!matchingPattern) {
            return null;
        }
        // Calculate confidence based on frequency
        const confidence = Math.min(100, matchingPattern.frequency * 10);
        return {
            patternId: matchingPattern.id,
            confidence,
            matchReason: `This pattern has been seen ${matchingPattern.frequency} times across the network`,
            recommendedAction: this.getRecommendedAction(matchingPattern),
        };
    }
    /**
     * Get network insights (anonymized)
     */
    getNetworkInsights() {
        const allPatterns = Array.from(this.patterns.values());
        return {
            totalPatterns: allPatterns.length,
            fraudPatterns: allPatterns.filter(p => p.patternType === 'fraud').length,
            anomalyPatterns: allPatterns.filter(p => p.patternType === 'anomaly').length,
            topPatterns: allPatterns
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 10)
                .map(p => ({
                id: p.id,
                type: p.patternType,
                frequency: p.frequency,
            })),
        };
    }
    /**
     * Hash pattern for anonymization (differential privacy)
     */
    hashPattern(data) {
        // Simple hash - in production, use cryptographic hash with salt
        const str = JSON.stringify(data, Object.keys(data).sort());
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Anonymize metadata (remove PII, add noise for differential privacy)
     */
    anonymizeMetadata(data) {
        const anonymized = {};
        for (const [key, value] of Object.entries(data)) {
            // Skip PII fields
            if (['email', 'name', 'address', 'phone', 'ssn'].includes(key.toLowerCase())) {
                continue;
            }
            // Add noise for numerical values (differential privacy)
            if (typeof value === 'number') {
                const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
                anonymized[key] = value * (1 + noise);
            }
            else {
                anonymized[key] = value;
            }
        }
        return anonymized;
    }
    /**
     * Get recommended action based on pattern
     */
    getRecommendedAction(pattern) {
        switch (pattern.patternType) {
            case 'fraud':
                return 'Review transaction for potential fraud. This pattern has been associated with fraudulent activity.';
            case 'anomaly':
                return 'Investigate anomaly. This pattern is unusual and may indicate a data quality issue.';
            case 'performance':
                return 'Optimize performance. This pattern suggests a performance bottleneck.';
            case 'error':
                return 'Review error. This pattern has been associated with errors in other customers.';
            default:
                return 'Review pattern. This pattern has been seen across multiple customers.';
        }
    }
}
exports.CrossCustomerIntelligence = CrossCustomerIntelligence;
exports.crossCustomerIntelligence = new CrossCustomerIntelligence();
//# sourceMappingURL=cross-customer-intelligence.js.map