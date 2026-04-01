import { EventEmitter } from "events";
import { decisionLog } from "./decision-log";
import { logInfo } from "../../utils/logger";

/**
 * AI Knowledge Base Assistant
 *
 * LLM-powered assistant that helps team members discover knowledge,
 * answer questions, and learn from past decisions and incidents.
 * Currently uses a mock LLM implementation with real retrieval from DecisionLog.
 */

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
  confidence: number; // 0-100
  sources: Array<{
    type: "decision" | "documentation" | "incident" | "pattern";
    id: string;
    relevance: number;
  }>;
  relatedQuestions?: string[];
}

export class AIKnowledgeAssistant extends EventEmitter {
  private knowledgeBase: Map<string, unknown> = new Map();

  /**
   * Queries the knowledge base with a natural language question.
   * Performs retrieval from structured logs and generates an answer (currently mocked).
   *
   * @param {KnowledgeQuery} query - The query data containing the question and context.
   * @returns {Promise<KnowledgeResponse>} The assistant's response.
   */
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    logInfo(`AI Assistant query: "${query.question}"`);
    // Retrieval: Search decisions
    const decisions = decisionLog.queryDecisions({
      search: query.question,
    });

    // Future retrieval paths:
    // - searchDocumentation(query.question)
    // - searchIncidents(query.question)

    // Generation: Generate answer using LLM (mock for now)
    const answer = await this.generateAnswer(query, decisions);

    return {
      answer,
      confidence: 85, // Mock confidence
      sources: decisions.slice(0, 3).map((d) => ({
        type: "decision" as const,
        id: d.id,
        relevance: 0.9,
      })),
      relatedQuestions: this.generateRelatedQuestions(query.question),
    };
  }

  /**
   * Generate answer using LLM (mock implementation)
   * In production, would call OpenAI/Anthropic API
   */
  private async generateAnswer(query: KnowledgeQuery, decisions: unknown[]): Promise<string> {
    // Mock LLM response
    // In production, would use actual LLM API
    return `Based on our decision logs, here's what I found:

${
  decisions.length > 0
    ? `We have ${decisions.length} related decisions that might help answer your question.`
    : "I couldn't find specific decisions related to your question."
}

For "${query.question}", I recommend reviewing our decision logs and documentation.`;
  }

  /**
   * Generate related questions
   */
  private generateRelatedQuestions(_question: string): string[] {
    // Mock related questions
    // In production, would use LLM to generate related questions
    return [
      "How do we handle similar situations?",
      "What decisions have we made about this topic?",
      "Are there any related incidents?",
    ];
  }

  /**
   * Indexes knowledge items for retrieval.
   *
   * @param {string} type - The item type (e.g., 'documentation').
   * @param {string} id - Unique identifier for the item.
   * @param {unknown} content - The content to index.
   */
  async indexKnowledge(type: string, id: string, content: unknown): Promise<void> {
    this.knowledgeBase.set(`${type}:${id}`, content);
    this.emit("knowledge_indexed", { type, id });
  }

  /**
   * Returns aggregated statistics for the knowledge base.
   */
  getStats(): {
    totalItems: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};

    for (const key of this.knowledgeBase.keys()) {
      const parts = key.split(":");
      const type = parts[0];
      if (type) {
        byType[type] = (byType[type] || 0) + 1;
      }
    }

    return {
      totalItems: this.knowledgeBase.size,
      byType,
    };
  }
}

export const aiKnowledgeAssistant = new AIKnowledgeAssistant();
