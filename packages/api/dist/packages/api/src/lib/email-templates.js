"use strict";
/**
 * Email Template Rendering System
 *
 * Renders lifecycle email templates with dynamic field replacement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailTemplate = renderEmailTemplate;
exports.generatePlainText = generatePlainText;
exports.getDefaultUrls = getDefaultUrls;
const fs_1 = require("fs");
const path_1 = require("path");
const logger_1 = require("../utils/logger");
/**
 * Simple template engine - replaces {{field}} with values
 */
function renderTemplate(template, data) {
    let rendered = template;
    // Flatten nested data structure for easier replacement
    const flatten = (obj, prefix = "") => {
        const result = {};
        for (const key in obj) {
            if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                Object.assign(result, flatten(obj[key], `${prefix}${key}.`));
            }
            else {
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
            (0, logger_1.logWarn)(`Email template field not found: ${field}`);
            return match; // Keep original if not found
        }
        return String(value);
    });
    return rendered;
}
/**
 * Load email template file
 */
function loadTemplate(templateName) {
    try {
        // Try lifecycle templates first
        const lifecyclePath = (0, path_1.join)(process.cwd(), "emails", "lifecycle", `${templateName}.html`);
        try {
            return (0, fs_1.readFileSync)(lifecyclePath, "utf8");
        }
        catch {
            // Try in root emails directory
            const rootPath = (0, path_1.join)(process.cwd(), "emails", `${templateName}.html`);
            return (0, fs_1.readFileSync)(rootPath, "utf8");
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to load email template", error, { templateName });
        throw new Error(`Email template not found: ${templateName}`);
    }
}
/**
 * Load and render email template with shared components
 */
function loadTemplateWithComponents(templateName) {
    let template = loadTemplate(templateName);
    // Load shared components
    try {
        const headerPath = (0, path_1.join)(process.cwd(), "emails", "shared", "components", "header.html");
        const footerPath = (0, path_1.join)(process.cwd(), "emails", "shared", "components", "footer.html");
        const buttonPath = (0, path_1.join)(process.cwd(), "emails", "shared", "components", "button.html");
        const header = (0, fs_1.readFileSync)(headerPath, "utf8");
        const footer = (0, fs_1.readFileSync)(footerPath, "utf8");
        const button = (0, fs_1.readFileSync)(buttonPath, "utf8");
        // Replace component includes
        template = template.replace(/\{\{>\s*header\s*\}\}/g, header);
        template = template.replace(/\{\{>\s*footer\s*\}\}/g, footer);
        template = template.replace(/\{\{>\s*button\s+([^}]+)\}\}/g, (_match, params) => {
            // Parse button parameters (simplified)
            const buttonData = {};
            params.split(/\s+/).forEach((param) => {
                const [key, value] = param.split("=");
                if (key && value) {
                    buttonData[key] = value.replace(/['"]/g, "");
                }
            });
            return renderTemplate(button, buttonData);
        });
    }
    catch (error) {
        (0, logger_1.logWarn)("Failed to load shared components, using template as-is", { error });
    }
    return template;
}
/**
 * Render email template with data
 */
async function renderEmailTemplate(templateName, data) {
    const template = loadTemplateWithComponents(templateName);
    return renderTemplate(template, data);
}
/**
 * Generate plain text version from HTML
 */
function generatePlainText(html) {
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
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        if (!match || !match[1] || !match[2])
            continue;
        const url = match[1];
        const linkText = match[2].replace(/<[^>]+>/g, "");
        text = text.replace(linkText, `${linkText} (${url})`);
    }
    return text;
}
/**
 * Get default URLs based on environment
 */
function getDefaultUrls() {
    const appUrl = process.env.APP_URL || process.env.VERCEL_URL
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
//# sourceMappingURL=email-templates.js.map