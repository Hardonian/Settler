/**
 * AI Knowledge Base Assistant
 *
 * LLM-powered assistant that helps team members discover knowledge,
 * answer questions, and learn from past decisions and incidents.
 */
import { EventEmitter } from 'events';
export interface KnowledgeQuery {
    question: string;
    context?: {
        userId?: string;
        department?: string;
        project?: string;
    };
}
export interface KnowledgeResponse {
    answer: string;
    confidence: number;
    sources: Array<{
        type: 'decision' | 'documentation' | 'incident' | 'pattern';
        id: string;
        relevance: number;
    }>;
    relatedQuestions?: string[];
}
export declare class AIKnowledgeAssistant extends EventEmitter {
    private knowledgeBase;
    /**
     * Query the knowledge base
     */
    query(query: KnowledgeQuery): Promise<KnowledgeResponse>;
    /**
     * Generate answer using LLM (mock implementation)
     * In production, would call OpenAI/Anthropic API
     */
    private generateAnswer;
    /**
     * Generate related questions
     */
    private generateRelatedQuestions;
    /**
     * Index knowledge (decisions, documentation, incidents)
     */
    indexKnowledge(type: string, id: string, content: unknown): Promise<void>;
    /**
     * Get knowledge base stats
     */
    getStats(): {
        totalItems: number;
        byType: Record<string, number>;
    };
}
export declare const aiKnowledgeAssistant: AIKnowledgeAssistant;
//# sourceMappingURL=ai-assistant.d.ts.map