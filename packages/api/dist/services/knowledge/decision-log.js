"use strict";
/**
 * Decision Log System
 *
 * Captures every significant decision with context, rationale, and outcomes.
 * Ensures institutional knowledge persists as the team grows.
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
exports.decisionLog = exports.DecisionLog = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class DecisionLog extends events_1.EventEmitter {
    decisions = new Map();
    logDirectory;
    constructor(logDirectory = './decisions') {
        super();
        this.logDirectory = logDirectory;
        this.ensureDirectoryExists();
    }
    /**
     * Create a new decision
     */
    async createDecision(decision) {
        const fullDecision = {
            ...decision,
            id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: new Date(),
        };
        this.decisions.set(fullDecision.id, fullDecision);
        // Save to file
        await this.saveDecision(fullDecision);
        this.emit('decision_created', fullDecision);
        return fullDecision;
    }
    /**
     * Update decision outcomes
     */
    async updateOutcomes(decisionId, outcome) {
        const decision = this.decisions.get(decisionId);
        if (!decision) {
            throw new Error(`Decision ${decisionId} not found`);
        }
        decision.actualOutcomes.push({
            date: new Date(),
            outcome,
        });
        // Save to file
        await this.saveDecision(decision);
        this.emit('decision_updated', decision);
        return decision;
    }
    /**
     * Update decision status
     */
    async updateStatus(decisionId, status) {
        const decision = this.decisions.get(decisionId);
        if (!decision) {
            throw new Error(`Decision ${decisionId} not found`);
        }
        decision.status = status;
        // Save to file
        await this.saveDecision(decision);
        this.emit('decision_status_updated', decision);
        return decision;
    }
    /**
     * Get a decision by ID
     */
    getDecision(decisionId) {
        return this.decisions.get(decisionId);
    }
    /**
     * Query decisions
     */
    queryDecisions(query) {
        let decisions = Array.from(this.decisions.values());
        if (query.status) {
            decisions = decisions.filter(d => d.status === query.status);
        }
        if (query.decisionMaker) {
            decisions = decisions.filter(d => d.decisionMakers.includes(query.decisionMaker));
        }
        if (query.tag) {
            decisions = decisions.filter(d => d.tags.includes(query.tag));
        }
        if (query.dateRange) {
            decisions = decisions.filter(d => d.date >= query.dateRange.start && d.date <= query.dateRange.end);
        }
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            decisions = decisions.filter(d => d.title.toLowerCase().includes(searchLower) ||
                d.context.toLowerCase().includes(searchLower) ||
                d.decision.toLowerCase().includes(searchLower));
        }
        return decisions.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    /**
     * Get related decisions
     */
    getRelatedDecisions(decisionId) {
        const decision = this.decisions.get(decisionId);
        if (!decision) {
            return [];
        }
        return decision.relatedDecisions
            .map(id => this.decisions.get(id))
            .filter((d) => d !== undefined);
    }
    /**
     * Save decision to file
     */
    async saveDecision(decision) {
        const filename = `${decision.id}.md`;
        const filepath = path.join(this.logDirectory, filename);
        const markdown = this.decisionToMarkdown(decision);
        await fs.writeFile(filepath, markdown, 'utf-8');
    }
    /**
     * Convert decision to markdown
     */
    decisionToMarkdown(decision) {
        return `# Decision: ${decision.title}

**Date:** ${decision.date.toISOString()}
**Decision Makers:** ${decision.decisionMakers.join(', ')}
**Status:** ${decision.status}

## Context
${decision.context}

## Decision
${decision.decision}

## Rationale
${decision.rationale}

## Alternatives Considered
${decision.alternativesConsidered.map(alt => `- **${alt.option}** - ${alt.whyNot}`).join('\n')}

## Expected Outcomes
${decision.expectedOutcomes}

## Actual Outcomes
${decision.actualOutcomes.map(outcome => `- **${outcome.date.toISOString()}:** ${outcome.outcome}`).join('\n')}

## Lessons Learned
${decision.lessonsLearned}

## Related Decisions
${decision.relatedDecisions.map(id => `- [${id}](./${id}.md)`).join('\n')}

## Tags
${decision.tags.map(tag => `\`${tag}\``).join(', ')}
`;
    }
    /**
     * Ensure directory exists
     */
    async ensureDirectoryExists() {
        try {
            await fs.mkdir(this.logDirectory, { recursive: true });
        }
        catch (error) {
            // Directory might already exist
        }
    }
    /**
     * Load decisions from directory
     */
    async loadDecisions() {
        try {
            const files = await fs.readdir(this.logDirectory);
            const markdownFiles = files.filter(f => f.endsWith('.md'));
            for (const file of markdownFiles) {
                const filepath = path.join(this.logDirectory, file);
                const _content = await fs.readFile(filepath, 'utf-8');
                void _content;
                // TODO: Parse markdown back to Decision object
                // For now, skip parsing
            }
        }
        catch (error) {
            console.error('Failed to load decisions:', error);
        }
    }
}
exports.DecisionLog = DecisionLog;
exports.decisionLog = new DecisionLog('./decisions');
//# sourceMappingURL=decision-log.js.map