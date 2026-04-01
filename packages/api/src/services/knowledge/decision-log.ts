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

export const DECISION_STATUSES = ["proposed", "accepted", "rejected", "superseded"] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export interface Decision {
  id: string;
  title: string;
  date: Date;
  decisionMakers: string[];
  status: DecisionStatus;
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

export interface DecisionQuery {
  status?: DecisionStatus;
  decisionMaker?: string;
  tag?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
}

export type CreateDecisionInput = Omit<Decision, "id" | "date">;

export interface DecisionLoadSummary {
  mode: "index_only";
  discoveredFiles: number;
  readableFiles: number;
  unreadableFiles: string[];
  populatedDecisions: number;
}

export class DecisionLog extends EventEmitter {
  private decisions: Map<string, Decision> = new Map();
  private logDirectory: string;
  private lastLoadSummary: DecisionLoadSummary = {
    mode: "index_only",
    discoveredFiles: 0,
    readableFiles: 0,
    unreadableFiles: [],
    populatedDecisions: 0,
  };

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
   * @param {CreateDecisionInput} decision - The decision data to persist.
   * @returns {Promise<Decision>} The newly created decision with ID and date.
   * @throws {Error} If saving the decision fails.
   */
  async createDecision(decision: CreateDecisionInput): Promise<Decision> {
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
   * Appends a newly observed outcome to an existing decision.
   *
   * @param {string} decisionId - The decision identifier.
   * @param {string} outcome - The outcome narrative to append.
   * @returns {Promise<Decision>} The updated decision.
   * @throws {Error} If the decision is not found or cannot be persisted.
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
   * Updates the status of an existing decision.
   *
   * @param {string} decisionId - The decision identifier.
   * @param {DecisionStatus} status - The new lifecycle status.
   * @returns {Promise<Decision>} The updated decision.
   * @throws {Error} If the decision is not found or cannot be persisted.
   */
  async updateStatus(decisionId: string, status: DecisionStatus): Promise<Decision> {
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
   * Returns a decision by ID from the in-memory index.
   *
   * @param {string} decisionId - The decision identifier.
   * @returns {Decision | undefined} The matching decision, if present.
   */
  getDecision(decisionId: string): Decision | undefined {
    return this.decisions.get(decisionId);
  }

  /**
   * Queries the decision log with optional filters.
   *
   * @param {DecisionQuery} query - The query filters.
   * @returns {Decision[]} Sorted list of matching decisions (newest first).
   */
  queryDecisions(query: DecisionQuery): Decision[] {
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
   * Returns the decisions linked from a given decision.
   *
   * @param {string} decisionId - The source decision identifier.
   * @returns {Decision[]} The related decisions that are currently indexed.
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
   * Returns the last startup-scan summary for markdown-backed decisions.
   *
   * The current implementation intentionally performs an index-only scan.
   * It verifies file readability and reports degraded loading semantics
   * until a structured, tenant-scoped persistence layer is introduced.
   *
   * @returns {DecisionLoadSummary} The most recent load summary.
   */
  getLoadSummary(): DecisionLoadSummary {
    return {
      ...this.lastLoadSummary,
      unreadableFiles: [...this.lastLoadSummary.unreadableFiles],
    };
  }

  /**
   * Persists a decision to its markdown representation on disk.
   *
   * @param {Decision} decision - The decision to persist.
   * @returns {Promise<void>}
   */
  private async saveDecision(decision: Decision): Promise<void> {
    const filename = `${decision.id}.md`;
    const filepath = path.join(this.logDirectory, filename);

    const markdown = this.decisionToMarkdown(decision);
    await fs.writeFile(filepath, markdown, "utf-8");
  }

  /**
   * Converts a decision into the markdown format stored on disk.
   *
   * @param {Decision} decision - The decision to serialize.
   * @returns {string} The markdown representation.
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
   * Ensures the backing markdown directory exists.
   *
   * @returns {Promise<void>}
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  /**
   * Performs an index-only startup scan of markdown decision files.
   *
   * This method deliberately does not hydrate {@link Decision} records from
   * markdown content because the current preview surface lacks a canonical,
   * tenant-scoped parser and persistence contract. Instead, it verifies file
   * readability and records machine-visible summary data about the degraded
   * loading mode.
   *
   * @returns {Promise<void>}
   */
  async loadDecisions(): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      const files = await fs.readdir(this.logDirectory);
      const markdownFiles = files.filter((f: string) => f.endsWith(".md"));
      const unreadableFiles: string[] = [];
      let readableFiles = 0;

      for (const file of markdownFiles) {
        const filepath = path.join(this.logDirectory, file);

        try {
          await fs.readFile(filepath, "utf-8");
          readableFiles += 1;
        } catch (error) {
          unreadableFiles.push(file);
          logError("Failed to read decision markdown during startup scan", error, {
            file: filepath,
          });
        }
      }

      this.lastLoadSummary = {
        mode: "index_only",
        discoveredFiles: markdownFiles.length,
        readableFiles,
        unreadableFiles,
        populatedDecisions: this.decisions.size,
      };

      logInfo("Decision log startup scan completed", { ...this.lastLoadSummary });
    } catch (error) {
      logError("Failed to load decisions from filesystem", error);
    }
  }
}

export const decisionLog = new DecisionLog("./decisions");
