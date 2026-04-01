import { EventEmitter } from "events";
import * as fs from "fs/promises";
import * as path from "path";
import { logError, logInfo } from "../../utils/logger";

/**
 * Decision Log System
 *
 * Captures every significant decision with context, rationale, and outcomes.
 * Ensures institutional knowledge persists as the team grows by storing
 * decisions in a human-readable and machine-processable format.
 */

export interface Decision {
  id: string;
  title: string;
  date: Date;
  decisionMakers: string[];
  status: "proposed" | "accepted" | "rejected" | "superseded";
  context: string;
  decision: string;
  rationale: string;
  alternativesConsidered: Array<{
    option: string;
    whyNot: string;
  }>;
  expectedOutcomes: string;
  actualOutcomes: Array<{
    date: Date;
    outcome: string;
  }>;
  lessonsLearned: string;
  relatedDecisions: string[]; // IDs of related decisions
  tags: string[];
}

export class DecisionLog extends EventEmitter {
  private decisions: Map<string, Decision> = new Map();
  private logDirectory: string;

  /**
   * Initializes the DecisionLog service.
   *
   * @param {string} logDirectory - The directory where decision markdown files are stored.
   */
  constructor(logDirectory: string = "./decisions") {
    super();
    this.logDirectory = logDirectory;
    this.ensureDirectoryExists().catch((err) => {
      logError("Failed to initialize decision log directory", err);
    });
  }

  /**
   * Creates a new decision and persists it to the filesystem.
   *
   * @param {Omit<Decision, 'id' | 'date'>} decision - The decision data.
   * @returns {Promise<Decision>} The newly created decision with ID and date.
   * @throws {Error} If saving the decision fails.
   */
  async createDecision(decision: Omit<Decision, "id" | "date">): Promise<Decision> {
    const fullDecision: Decision = {
      ...decision,
      id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      date: new Date(),
    };

    this.decisions.set(fullDecision.id, fullDecision);

    try {
      await this.saveDecision(fullDecision);
      this.emit("decision_created", fullDecision);
      logInfo(`Decision created: ${fullDecision.id} - ${fullDecision.title}`);
      return fullDecision;
    } catch (error) {
      logError(`Failed to save decision ${fullDecision.id}`, error);
      throw new Error(
        `Failed to persist decision: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Update decision outcomes
   */
  async updateOutcomes(decisionId: string, outcome: string): Promise<Decision> {
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

    this.emit("decision_updated", decision);
    return decision;
  }

  /**
   * Update decision status
   */
  async updateStatus(decisionId: string, status: Decision["status"]): Promise<Decision> {
    const decision = this.decisions.get(decisionId);

    if (!decision) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    decision.status = status;

    // Save to file
    await this.saveDecision(decision);

    this.emit("decision_status_updated", decision);
    return decision;
  }

  /**
   * Get a decision by ID
   */
  getDecision(decisionId: string): Decision | undefined {
    return this.decisions.get(decisionId);
  }

  /**
   * Queries the decision log with optional filters.
   *
   * @param {Object} query - The query filters.
   * @param {Decision['status']} [query.status] - Filter by status.
   * @param {string} [query.decisionMaker] - Filter by decision maker.
   * @param {string} [query.tag] - Filter by tag.
   * @param {Object} [query.dateRange] - Filter by date range.
   * @param {string} [query.search] - Search text in title, context, or decision.
   * @returns {Decision[]} Sorted list of matching decisions (newest first).
   */
  queryDecisions(query: {
    status?: Decision["status"];
    decisionMaker?: string;
    tag?: string;
    dateRange?: { start: Date; end: Date };
    search?: string;
  }): Decision[] {
    let decisions = Array.from(this.decisions.values());

    if (query.status) {
      decisions = decisions.filter((d) => d.status === query.status);
    }

    if (query.decisionMaker) {
      decisions = decisions.filter((d) => d.decisionMakers.includes(query.decisionMaker!));
    }

    if (query.tag) {
      decisions = decisions.filter((d) => d.tags.includes(query.tag!));
    }

    if (query.dateRange) {
      decisions = decisions.filter(
        (d) => d.date >= query.dateRange!.start && d.date <= query.dateRange!.end
      );
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      decisions = decisions.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.context.toLowerCase().includes(searchLower) ||
          d.decision.toLowerCase().includes(searchLower)
      );
    }

    return decisions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get related decisions
   */
  getRelatedDecisions(decisionId: string): Decision[] {
    const decision = this.decisions.get(decisionId);

    if (!decision) {
      return [];
    }

    return decision.relatedDecisions
      .map((id) => this.decisions.get(id))
      .filter((d): d is Decision => d !== undefined);
  }

  /**
   * Save decision to file
   */
  private async saveDecision(decision: Decision): Promise<void> {
    const filename = `${decision.id}.md`;
    const filepath = path.join(this.logDirectory, filename);

    const markdown = this.decisionToMarkdown(decision);
    await fs.writeFile(filepath, markdown, "utf-8");
  }

  /**
   * Convert decision to markdown
   */
  private decisionToMarkdown(decision: Decision): string {
    return `# Decision: ${decision.title}

**Date:** ${decision.date.toISOString()}
**Decision Makers:** ${decision.decisionMakers.join(", ")}
**Status:** ${decision.status}

## Context
${decision.context}

## Decision
${decision.decision}

## Rationale
${decision.rationale}

## Alternatives Considered
${decision.alternativesConsidered.map((alt) => `- **${alt.option}** - ${alt.whyNot}`).join("\n")}

## Expected Outcomes
${decision.expectedOutcomes}

## Actual Outcomes
${decision.actualOutcomes.map((outcome) => `- **${outcome.date.toISOString()}:** ${outcome.outcome}`).join("\n")}

## Lessons Learned
${decision.lessonsLearned}

## Related Decisions
${decision.relatedDecisions.map((id) => `- [${id}](./${id}.md)`).join("\n")}

## Tags
${decision.tags.map((tag) => `\`${tag}\``).join(", ")}
`;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  /**
   * Loads decisions from the directory on startup.
   * Note: Markdown parsing into Decision objects is currently a placeholder.
   * Decisions are expected to be populated via the createDecision path or
   * a future migration to a structured DB.
   */
  async loadDecisions(): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      const files = await fs.readdir(this.logDirectory);
      const markdownFiles = files.filter((f: string) => f.endsWith(".md"));

      for (const file of markdownFiles) {
        const filepath = path.join(this.logDirectory, file);
        const _content = await fs.readFile(filepath, "utf-8");
        void _content;
        // In-memory population from markdown content would occur here
      }
      logInfo(`Loaded ${markdownFiles.length} decision files (index-only)`);
    } catch (error) {
      logError("Failed to load decisions from filesystem", error);
    }
  }
}

export const decisionLog = new DecisionLog("./decisions");
