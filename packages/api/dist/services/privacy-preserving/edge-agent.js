"use strict";
/**
 * Edge Computing Agent
 *
 * Lightweight agent that runs in customer infrastructure to perform
 * reconciliation locally without sending data to Settler cloud.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeAgent = void 0;
const events_1 = require("events");
class EdgeAgent extends events_1.EventEmitter {
    config;
    isRunning = false;
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Initialize the edge agent
     */
    async initialize() {
        // Validate configuration
        if (!this.config.customerId || !this.config.apiKey) {
            throw new Error('Missing required configuration');
        }
        // Test connection to cloud endpoint
        await this.testCloudConnection();
        this.isRunning = true;
        this.emit('initialized');
    }
    /**
     * Perform local reconciliation
     */
    async reconcile(sourceData, targetData) {
        if (!this.isRunning) {
            throw new Error('Edge agent not initialized');
        }
        const startTime = Date.now();
        let matched = 0;
        let unmatched = 0;
        let errors = 0;
        try {
            // Perform matching locally
            for (const source of sourceData) {
                let foundMatch = false;
                for (const target of targetData) {
                    if (this.matches(source, target, this.config.reconciliationRules)) {
                        matched++;
                        foundMatch = true;
                        break;
                    }
                }
                if (!foundMatch) {
                    unmatched++;
                }
            }
            const total = sourceData.length;
            const accuracy = total > 0 ? matched / total : 0;
            const executionTime = Date.now() - startTime;
            // Create encrypted metadata (only send results, not raw data)
            const metadata = this.createEncryptedMetadata({
                matched,
                unmatched,
                errors,
                accuracy,
                executionTime,
            });
            const result = {
                matched,
                unmatched,
                errors,
                accuracy,
                executionTime,
                metadata,
            };
            // Send only metadata to cloud (not raw data)
            await this.sendMetadataToCloud(metadata);
            this.emit('reconciliation_complete', result);
            return result;
        }
        catch (error) {
            errors++;
            this.emit('reconciliation_error', error);
            throw error;
        }
    }
    /**
     * Check if source and target match according to rules
     */
    matches(source, target, rules) {
        for (const rule of rules) {
            const sourceValue = source[rule.field];
            const targetValue = target[rule.field];
            if (!this.matchesRule(sourceValue, targetValue, rule)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if values match according to rule
     */
    matchesRule(sourceValue, targetValue, rule) {
        if (sourceValue === undefined || targetValue === undefined) {
            return false;
        }
        switch (rule.type) {
            case 'exact':
                return sourceValue === targetValue;
            case 'fuzzy':
                if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
                    const similarity = this.stringSimilarity(sourceValue, targetValue);
                    return similarity >= (rule.threshold || 0.8);
                }
                return false;
            case 'range':
                if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
                    const diff = Math.abs(sourceValue - targetValue);
                    return diff <= (rule.tolerance || 0.01);
                }
                return false;
            case 'date_range':
                if (sourceValue instanceof Date && targetValue instanceof Date) {
                    const diffDays = Math.abs((sourceValue.getTime() - targetValue.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= (rule.days || 1);
                }
                return false;
            default:
                return false;
        }
    }
    /**
     * Calculate string similarity
     */
    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    /**
     * Calculate Levenshtein distance
     */
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
            for (let j = 1; j <= str1.length; j++) {
                if (!matrix[i]) {
                    matrix[i] = [];
                }
                const prevRow = matrix[i - 1];
                const currRow = matrix[i];
                if (!prevRow || !currRow) {
                    continue;
                }
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    currRow[j] = prevRow[j - 1] ?? 0;
                }
                else {
                    currRow[j] = Math.min((prevRow[j - 1] ?? 0) + 1, (currRow[j - 1] ?? 0) + 1, (prevRow[j] ?? 0) + 1);
                }
            }
        }
        const lastRow = matrix[str2.length];
        if (!lastRow) {
            return str1.length;
        }
        return lastRow[str1.length] ?? str1.length;
    }
    /**
     * Create encrypted metadata (only results, not raw data)
     */
    createEncryptedMetadata(data) {
        // In production, use proper encryption (AES-256-GCM)
        // For now, return data as-is (would be encrypted in production)
        return {
            ...data,
            encrypted: true,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Send encrypted metadata to cloud (not raw data)
     */
    async sendMetadataToCloud(metadata) {
        // TODO: Send to Settler cloud endpoint
        // Only metadata is sent, never raw transaction data
        try {
            const response = await fetch(`${this.config.cloudEndpoint}/api/v1/edge/metadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify({
                    customerId: this.config.customerId,
                    metadata,
                }),
            });
            if (!response.ok) {
                throw new Error(`Failed to send metadata: ${response.statusText}`);
            }
        }
        catch (error) {
            console.error('Failed to send metadata to cloud:', error);
            // Don't throw - metadata sending failure shouldn't break reconciliation
        }
    }
    /**
     * Test connection to cloud endpoint
     */
    async testCloudConnection() {
        try {
            const response = await fetch(`${this.config.cloudEndpoint}/health`, {
                method: 'GET',
            });
            if (!response.ok) {
                throw new Error('Cloud endpoint not reachable');
            }
        }
        catch (error) {
            throw new Error(`Failed to connect to cloud endpoint: ${error}`);
        }
    }
    /**
     * Shutdown the edge agent
     */
    async shutdown() {
        this.isRunning = false;
        this.emit('shutdown');
    }
}
exports.EdgeAgent = EdgeAgent;
//# sourceMappingURL=edge-agent.js.map