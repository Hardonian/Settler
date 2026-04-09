/**
 * Email Template Rendering System
 *
 * Renders lifecycle email templates with dynamic field replacement
 */

import { readFileSync } from "fs";
import { join } from "path";
import { logError, logWarn } from "../utils/logger";

/**
 * Dynamic field data structure
 */
export interface EmailTemplateData {
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    industry?: string;
    company_name?: string;
    plan_type?: string;
  };
  trial?: {
    trial_end_date?: string;
    trial_start_date?: string;
    days_remaining?: number;
    charge_date?: string;
  };
  product?: {
    product_name?: string;
    upgrade_url?: string;
    dashboard_url?: string;
    support_url?: string;
    pricing_url?: string;
    docs_url?: string;
    playground_url?: string;
    cookbooks_url?: string;
  };
  reconciliation?: {
    job_name?: string;
    job_id?: string;
    matched_count?: number;
    unmatched_count?: number;
    accuracy?: number;
    time_saved?: number;
    report_url?: string;
    platform_name?: string;
  };
  recommendations?: {
    next_recommendation?: string;
    workflow_suggestion?: string;
    analysis_summary?: string;
    top_insight_1?: string;
    top_insight_2?: string;
    recommendation_1?: string;
    recommendation_2?: string;
  };
  metrics?: {
    total_reconciliations?: number;
    jobs_created?: number;
    accuracy?: number;
    time_saved?: number;
  };
  workflow?: {
    workflow_name?: string;
    workflow_description?: string;
    use_case?: string;
    setup_time?: string;
    workflow_url?: string;
  };
  case_study?: {
    similar_company?: string;
    case_study_url?: string;
    case_studies_url?: string;
  };
  monthly?: {
    month?: string;
    renewal_date?: string;
    milestone_name?: string;
    milestone_metric?: string;
  };
  urls?: {
    profile_setup_url?: string;
    demo_url?: string;
    free_tier_url?: string;
    free_tier_info_url?: string;
    consultation_url?: string;
    insights_url?: string;
  };
  [key: string]: unknown; // Allow additional fields
}

/**
 * Simple template engine - replaces {{field}} with values
 */
function renderTemplate(template: string, data: EmailTemplateData): string {
  let rendered = template;

  // Flatten nested data structure for easier replacement
  const flatten = (
    obj: EmailTemplateData | Record<string, unknown>,
    prefix = ""
  ): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        Object.assign(result, flatten(obj[key] as Record<string, unknown>, `${prefix}${key}.`));
      } else {
        result[`${prefix}${key}`] = obj[key];
      }
    }
    return result;
  };

  const flatData = flatten(data);

  // Replace {{field}} and {{field.path}} patterns
  rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
    const value = flatData[field] ?? data[field];
    if (value === undefined || value === null) {
      logWarn(`Email template field not found: ${field}`);
      return match; // Keep original if not found
    }
    return String(value);
  });

  return rendered;
}

/**
 * Load email template file
 */
function loadTemplate(templateName: string): string {
  try {
    // Try lifecycle templates first
    const lifecyclePath = join(process.cwd(), "emails", "lifecycle", `${templateName}.html`);
    try {
      return readFileSync(lifecyclePath, "utf8");
    } catch {
      // Try in root emails directory
      const rootPath = join(process.cwd(), "emails", `${templateName}.html`);
      return readFileSync(rootPath, "utf8");
    }
  } catch (error) {
    logError("Failed to load email template", error as Error, { templateName });
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Load and render email template with shared components
 */
function loadTemplateWithComponents(templateName: string): string {
  let template = loadTemplate(templateName);

  // Load shared components
  try {
    const headerPath = join(process.cwd(), "emails", "shared", "components", "header.html");
    const footerPath = join(process.cwd(), "emails", "shared", "components", "footer.html");
    const buttonPath = join(process.cwd(), "emails", "shared", "components", "button.html");

    const header = readFileSync(headerPath, "utf8");
    const footer = readFileSync(footerPath, "utf8");
    const button = readFileSync(buttonPath, "utf8");

    // Replace component includes
    template = template.replace(/\{\{>\s*header\s*\}\}/g, header);
    template = template.replace(/\{\{>\s*footer\s*\}\}/g, footer);
    template = template.replace(/\{\{>\s*button\s+([^}]+)\}\}/g, (_match, params) => {
      // Parse button parameters (simplified)
      const buttonData: Record<string, string> = {};
      params.split(/\s+/).forEach((param: string) => {
        const [key, value] = param.split("=");
        if (key && value) {
          buttonData[key] = value.replace(/['"]/g, "");
        }
      });
      return renderTemplate(button, buttonData);
    });
  } catch (error) {
    logWarn("Failed to load shared components, using template as-is", { error });
  }

  return template;
}

/**
 * Render email template with data
 */
export async function renderEmailTemplate(
  templateName: string,
  data: EmailTemplateData
): Promise<string> {
  const template = loadTemplateWithComponents(templateName);
  return renderTemplate(template, data);
}

/**
 * Generate plain text version from HTML
 */
export function generatePlainText(html: string): string {
  // Simple HTML to text conversion
  let text = html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<script[^>]*>.*?<\/script>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Extract links and add them as text
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    if (!match || !match[1] || !match[2]) continue;
    const url = match[1];
    const linkText = match[2].replace(/<[^>]+>/g, "");
    text = text.replace(linkText, `${linkText} (${url})`);
  }

  return text;
}

/**
 * Get default URLs based on environment
 */
export function getDefaultUrls(): EmailTemplateData["product"] & EmailTemplateData["urls"] {
  const appUrl =
    process.env.APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://app.settler.dev";

  return {
    product_name: "Settler",
    upgrade_url: `${appUrl}/pricing`,
    dashboard_url: `${appUrl}/dashboard`,
    support_url: `${appUrl}/support`,
    pricing_url: `${appUrl}/pricing`,
    docs_url: `${appUrl}/docs`,
    playground_url: `${appUrl}/playground`,
    cookbooks_url: `${appUrl}/cookbooks`,
    profile_setup_url: `${appUrl}/dashboard?setup=profile`,
    demo_url: `${appUrl}/playground?demo=true`,
    free_tier_url: `${appUrl}/pricing#free`,
    free_tier_info_url: `${appUrl}/pricing#free`,
    consultation_url: `${appUrl}/support?book=consultation`,
    insights_url: `${appUrl}/dashboard/insights`,
  };
}
