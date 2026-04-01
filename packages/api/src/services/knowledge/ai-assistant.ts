import { EventEmitter } from "events";
import { type Decision, decisionLog } from "./decision-log";
import { logInfo } from "../../utils/logger";

/**
 * AI Knowledge Base Assistant
 *
 * LLM-powered assistant that helps team members discover knowledge,
 * answer questions, and learn from past decisions and incidents.
 * Currently uses a mock LLM implementation with real retrieval from DecisionLog.
 */

export interface KnowledgeQuery {
  tenantId: string;
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
    type: "decision" | "documentation" | "incident" | "pattern";
    id: string;
    relevance: number;
  }>;
  relatedQuestions?: string[];
  generation: {
    mode: "mock_template";
    degraded: true;
    productionIntegrationPath: string;
  };
}

const MOCK_GENERATION_MODE = "mock_template" as const;
const PRODUCTION_INTEGRATION_PATH =
  "Replace template generation with a tenant-scoped retrieval and LLM pipeline once durable knowledge storage is available.";

export class AIKnowledgeAssistant extends EventEmitter {
  private knowledgeBase: Map<string, unknown> = new Map();

  /**
   * Queries the knowledge base with a natural language question.
   * Performs retrieval from structured logs and returns a degraded mock answer
   * that keeps preview-mode behavior explicit until a production LLM path is
   * wired to tenant-scoped knowledge storage.
   *
   * @param {KnowledgeQuery} query - The query data containing the question and context.
   * @returns {Promise<KnowledgeResponse>} The assistant's response.
   */
  async query(query: KnowledgeQuery): Promise<KnowledgeResponse> {
    logInfo(`AI Assistant query: "${query.question}"`, {
      generation_mode: MOCK_GENERATION_MODE,
    });

    const decisions = decisionLog.queryDecisions({
      tenantId: query.tenantId,
      search: query.question,
    });

    const answer = await this.generateAnswer(query, decisions);

    return {
      answer,
      confidence: 85,
      sources: decisions.slice(0, 3).map((d) => ({
        type: "decision" as const,
        id: d.id,
        relevance: 0.9,
      })),
      relatedQuestions: this.generateRelatedQuestions(query.question),
      generation: {
        mode: MOCK_GENERATION_MODE,
        degraded: true,
        productionIntegrationPath: PRODUCTION_INTEGRATION_PATH,
      },
    };
  }

  /**
   * Generates the current mock response body.
   *
   * Production integration path:
   * 1. Keep retrieval tenant scoped and deterministic.
   * 2. Replace this template generator with a provider-backed LLM call.
   * 3. Preserve explicit degraded metadata whenever the provider path is bypassed.
   *
   * @param {KnowledgeQuery} query - The user question and optional context.
   * @param {Decision[]} decisions - Retrieved decision matches used for context.
   * @returns {Promise<string>} A preview-safe answer string.
   */
  private async generateAnswer(query: KnowledgeQuery, decisions: Decision[]): Promise<string> {
    return `Based on our decision logs, here's what I found:

${
  decisions.length > 0
    ? `We have ${decisions.length} related decisions that might help answer your question.`
    : "I couldn't find specific decisions related to your question."
}

For "${query.question}", I recommend reviewing our decision logs and documentation.`;
  }

  /**
   * Returns stable related-question suggestions for preview mode.
   *
   * @param {string} _question - The original question. Reserved for future model-backed expansion.
   * @returns {string[]} A list of follow-up questions.
   */
  private generateRelatedQuestions(_question: string): string[] {
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
   * @returns {Promise<void>}
   */
  async indexKnowledge(type: string, id: string, content: unknown): Promise<void> {
    this.knowledgeBase.set(`${type}:${id}`, content);
    this.emit("knowledge_indexed", { type, id });
  }

  /**
   * Returns aggregated statistics for the in-memory knowledge index.
   *
   * @returns {{ totalItems: number; byType: Record<string, number> }} Index statistics.
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
