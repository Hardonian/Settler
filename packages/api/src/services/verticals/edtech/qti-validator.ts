/**
 * EdTech Module - QTI Validator
 *
 * Part of Phase IV: Vertical Modules
 */

import { logInfo, logError } from "../../../utils/logger";

export interface QTIValidationResult {
  valid: boolean;
  errors: Array<{
    line: number;
    message: string;
    severity: "error" | "warning";
  }>;
  warnings: string[];
}

interface Syllabus {
  outcomes?: string[];
  standards?: string[];
  [key: string]: unknown;
}

interface LearningOutcome {
  id: string;
  description: string;
  standard?: string;
  [key: string]: unknown;
}

export class QTIValidator {
  /**
   * Validate QTI (Question and Test Interoperability) format
   */
  async validateQTI(qtiContent: string): Promise<QTIValidationResult> {
    const errors: Array<{ line: number; message: string; severity: "error" | "warning" }> = [];
    const warnings: string[] = [];

    try {
      // Check if valid XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(qtiContent, "text/xml");
      
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        errors.push({
          line: 0,
          message: "Invalid XML structure",
          severity: "error",
        });
        return { valid: false, errors, warnings };
      }

      // Check root element
      const root = xmlDoc.documentElement;
      if (!root.tagName.includes("assessment") && !root.tagName.includes("item")) {
        errors.push({
          line: 1,
          message: "Root element must be assessment or item",
          severity: "error",
        });
      }

      // Check required QTI elements
      const requiredElements = ["title", "identifier"];
      for (const element of requiredElements) {
        const attr = root.getAttribute(element);
        if (!attr || attr.trim() === "") {
          errors.push({
            line: 1,
            message: `Missing required attribute: ${element}`,
            severity: "error",
          });
        }
      }

      // Check for questions
      const questions = xmlDoc.querySelectorAll("choiceInteraction, matchInteraction, orderInteraction, textEntryInteraction");
      if (questions.length === 0) {
        warnings.push("No interactive questions found in assessment");
      }

      // Check for response processing
      const responseProcessing = xmlDoc.querySelector("responseProcessing");
      if (!responseProcessing) {
        warnings.push("No response processing defined - answers will not be scored");
      }

      // Validate each question has correct answer
      questions.forEach((q, index) => {
        const responseId = q.getAttribute("responseIdentifier");
        if (!responseId) {
          errors.push({
            line: index + 1,
            message: `Question ${index + 1} missing response identifier`,
            severity: "error",
          });
        }
      });

      logInfo("QTI validation completed", { 
        valid: errors.length === 0, 
        errorCount: errors.length, 
        warningCount: warnings.length 
      });

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logError("QTI validation failed", error);
      errors.push({
        line: 0,
        message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "error",
      });
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate learning outcome mapping
   */
  async validateLearningOutcomes(
    syllabus: Syllabus,
    outcomes: LearningOutcome[]
  ): Promise<{
    valid: boolean;
    missing: string[];
    extra: string[];
  }> {
    const syllabusOutcomes = new Set(syllabus.outcomes || []);
    const syllabusStandards = new Set(syllabus.standards || []);
    
    const outcomeIds = new Set(outcomes.map(o => o.id));
    const outcomeStandards = new Set(outcomes.map(o => o.standard).filter(Boolean) as string[]);

    // Find missing outcomes (in syllabus but not in outcomes)
    const missing: string[] = [];
    for (const so of syllabusOutcomes) {
      if (!outcomeIds.has(so) && !Array.from(outcomeStandards).some(s => s.includes(so))) {
        missing.push(so);
      }
    }

    // Find extra outcomes (in outcomes but not in syllabus)
    const extra: string[] = [];
    for (const oid of outcomeIds) {
      if (!syllabusOutcomes.has(oid) && !Array.from(syllabusStandards).some(s => oid.includes(s))) {
        extra.push(oid);
      }
    }

    const valid = missing.length === 0;

    logInfo("Learning outcome validation completed", { 
      valid, 
      missingCount: missing.length, 
      extraCount: extra.length 
    });

    return { valid, missing, extra };
  }

  /**
   * Check LMS compatibility
   */
  async checkLMSCompatibility(
    qtiContent: string,
    lms: "canvas" | "blackboard" | "moodle" | "brightspace"
  ): Promise<{
    compatible: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(qtiContent, "text/xml");

      // LMS-specific compatibility checks
      switch (lms) {
        case "canvas":
          // Canvas supports QTI 2.1 but has limitations
          if (xmlDoc.querySelector("hotspotInteraction")) {
            issues.push("Canvas has limited support for hotspot interactions");
          }
          if (xmlDoc.querySelector("graphicOrderInteraction")) {
            issues.push("Canvas does not support graphic order interactions");
          }
          break;

        case "blackboard":
          // Blackboard supports QTI 2.1
          if (xmlDoc.querySelector("positionObjectStage")) {
            issues.push("Blackboard has limited support for position object interactions");
          }
          break;

        case "moodle":
          // Moodle has good QTI 2.1 support
          if (xmlDoc.querySelector("endAttemptInteraction")) {
            issues.push("Moodle does not support end attempt interactions");
          }
          break;

        case "brightspace":
          // D2L Brightspace
          if (xmlDoc.querySelector("drawingInteraction")) {
            issues.push("Brightspace does not support drawing interactions");
          }
          break;
      }

      // Check for unsupported interaction types across all LMS
      const unsupportedInteractions = xmlDoc.querySelectorAll("uploadInteraction, customInteraction");
      if (unsupportedInteractions.length > 0) {
        issues.push("File upload and custom interactions may not be supported by all LMS platforms");
      }

      const compatible = issues.length === 0;

      logInfo("LMS compatibility check completed", { lms, compatible, issueCount: issues.length });

      return { compatible, issues };
    } catch (error) {
      logError("LMS compatibility check failed", error);
      return { 
        compatible: false, 
        issues: ["Failed to parse QTI content"] 
      };
    }
  }
}
