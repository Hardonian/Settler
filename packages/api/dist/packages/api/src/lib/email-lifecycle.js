"use strict";
/**
 * Lifecycle Email Functions
 *
 * Sends lifecycle emails for trial, paid, and retention
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTrialWelcomeEmail = sendTrialWelcomeEmail;
exports.sendTrialValueEmail = sendTrialValueEmail;
exports.sendTrialGatedFeaturesEmail = sendTrialGatedFeaturesEmail;
exports.sendTrialCaseStudyEmail = sendTrialCaseStudyEmail;
exports.sendTrialComparisonEmail = sendTrialComparisonEmail;
exports.sendTrialUrgencyEmail = sendTrialUrgencyEmail;
exports.sendTrialEndedEmail = sendTrialEndedEmail;
exports.sendPaidWelcomeEmail = sendPaidWelcomeEmail;
exports.sendMonthlySummaryEmail = sendMonthlySummaryEmail;
exports.sendLowActivityEmail = sendLowActivityEmail;
const email_1 = require("./email");
const email_templates_1 = require("./email-templates");
const logger_1 = require("../utils/logger");
/**
 * Helper to create EmailTemplateData with proper optional property handling
 */
function createEmailData(base) {
    const urls = (0, email_templates_1.getDefaultUrls)();
    const data = { ...base };
    // Conditionally add product properties only if defined
    const product = {};
    if (urls?.product_name !== undefined)
        product.product_name = urls.product_name;
    if (urls?.upgrade_url !== undefined)
        product.upgrade_url = urls.upgrade_url;
    if (urls?.dashboard_url !== undefined)
        product.dashboard_url = urls.dashboard_url;
    if (urls?.support_url !== undefined)
        product.support_url = urls.support_url;
    if (urls?.pricing_url !== undefined)
        product.pricing_url = urls.pricing_url;
    if (urls?.docs_url !== undefined)
        product.docs_url = urls.docs_url;
    if (urls?.playground_url !== undefined)
        product.playground_url = urls.playground_url;
    if (urls?.cookbooks_url !== undefined)
        product.cookbooks_url = urls.cookbooks_url;
    // Conditionally add urls properties only if defined
    const urlsData = {};
    if (urls?.profile_setup_url !== undefined)
        urlsData.profile_setup_url = urls.profile_setup_url;
    if (urls?.demo_url !== undefined)
        urlsData.demo_url = urls.demo_url;
    if (urls?.free_tier_url !== undefined)
        urlsData.free_tier_url = urls.free_tier_url;
    if (urls?.free_tier_info_url !== undefined)
        urlsData.free_tier_info_url = urls.free_tier_info_url;
    if (urls?.consultation_url !== undefined)
        urlsData.consultation_url = urls.consultation_url;
    if (urls?.insights_url !== undefined)
        urlsData.insights_url = urls.insights_url;
    data.product = product;
    data.urls = urlsData;
    return data;
}
/**
 * Send trial welcome email (Day 0)
 */
async function sendTrialWelcomeEmail(user, trialData) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const trialEnd = new Date(trialData.trialEndDate);
        const chargeDate = isNaN(trialEnd.getTime())
            ? undefined
            : new Date(trialEnd.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const trial = {
            trial_end_date: trialData.trialEndDate,
            trial_start_date: trialData.trialStartDate,
            days_remaining: trialData.daysRemaining,
        };
        if (chargeDate) {
            trial.charge_date = chargeDate;
        }
        const data = createEmailData({
            user: {
                first_name: firstName,
                email: user.email,
                ...(user.industry && { industry: user.industry }),
                ...(user.companyName && { company_name: user.companyName }),
                plan_type: user.planType || "trial",
            },
            trial,
        });
        const html = await (0, email_templates_1.renderEmailTemplate)("trial_welcome", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: "Welcome to Settler! 🎉",
            html,
            text,
            tags: [{ name: "email_type", value: "trial_welcome" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial welcome email", error, { user: user.email });
        return null;
    }
}
/**
 * Send trial value demonstration email (Day 2-3)
 */
async function sendTrialValueEmail(user, trialData, reconciliationData) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = createEmailData({
            user: {
                first_name: firstName,
                email: user.email,
            },
            trial: {
                days_remaining: trialData.daysRemaining,
            },
            reconciliation: {
                platform_name: reconciliationData.platformName,
                matched_count: reconciliationData.matchedCount,
                unmatched_count: reconciliationData.unmatchedCount,
                time_saved: reconciliationData.timeSaved,
                report_url: reconciliationData.reportUrl,
            },
        });
        const html = await (0, email_templates_1.renderEmailTemplate)("trial_day2", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: "Your first reconciliation is ready! 🎉",
            html,
            text,
            tags: [{ name: "email_type", value: "trial_value" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial value email", error, { user: user.email });
        return null;
    }
}
/**
 * Send trial gated features email (Day 7)
 */
async function sendTrialGatedFeaturesEmail(user, trialData) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
            trial: {
                days_remaining: trialData.daysRemaining,
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("trial_day7", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: "Unlock advanced features (still free for 23 days)",
            html,
            text,
            tags: [{ name: "email_type", value: "trial_gated_features" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial gated features email", error, { user: user.email });
        return null;
    }
}
/**
 * Send trial case study email (Day 14)
 */
async function sendTrialCaseStudyEmail(user, trialData, caseStudy) {
    try {
        const urls = (0, email_templates_1.getDefaultUrls)();
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
                ...(user.industry && { industry: user.industry }),
            },
            trial: {
                days_remaining: trialData.daysRemaining,
            },
            case_study: {
                similar_company: caseStudy.companyName,
                case_study_url: caseStudy.caseStudyUrl,
                case_studies_url: `${urls?.docs_url || "https://docs.settler.dev"}/case-studies`,
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("trial_day14", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: `How ${caseStudy.companyName} saved 15 hours/week with Settler`,
            html,
            text,
            tags: [{ name: "email_type", value: "trial_case_study" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial case study email", error, { user: user.email });
        return null;
    }
}
/**
 * Send trial comparison email (Day 21)
 */
async function sendTrialComparisonEmail(user, trialData) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
            trial: {
                days_remaining: trialData.daysRemaining,
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("trial_day21", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: "Here's what you're missing (9 days left)",
            html,
            text,
            tags: [{ name: "email_type", value: "trial_comparison" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial comparison email", error, { user: user.email });
        return null;
    }
}
/**
 * Send trial urgency email (Day 27-29)
 */
async function sendTrialUrgencyEmail(user, trialData, day) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
            trial: (() => {
                const trialEnd = new Date(trialData.trialEndDate);
                const chargeDate = isNaN(trialEnd.getTime())
                    ? undefined
                    : new Date(trialEnd.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                const trial = {
                    trial_end_date: trialData.trialEndDate,
                    days_remaining: trialData.daysRemaining,
                };
                if (chargeDate) {
                    trial.charge_date = chargeDate;
                }
                return trial;
            })(),
        };
        const templateName = `trial_day${day}`;
        const html = await (0, email_templates_1.renderEmailTemplate)(templateName, data);
        const text = (0, email_templates_1.generatePlainText)(html);
        const subjects = {
            27: "⏰ Your trial ends in 3 days",
            28: "Last chance: Trial ends tomorrow",
            29: "Final reminder: Trial ends today",
        };
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: subjects[day],
            html,
            text,
            tags: [{ name: "email_type", value: `trial_urgency_day${day}` }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial urgency email", error, { user: user.email, day });
        return null;
    }
}
/**
 * Send trial ended email (Day 30)
 */
async function sendTrialEndedEmail(user) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("trial_ended", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: "Your trial has ended - Choose your plan",
            html,
            text,
            tags: [{ name: "email_type", value: "trial_ended" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send trial ended email", error, { user: user.email });
        return null;
    }
}
/**
 * Send paid welcome email
 */
async function sendPaidWelcomeEmail(user) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("paid_welcome", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: "Welcome to Commercial! 🎉",
            html,
            text,
            tags: [{ name: "email_type", value: "paid_welcome" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send paid welcome email", error, { user: user.email });
        return null;
    }
}
/**
 * Send monthly summary email
 */
async function sendMonthlySummaryEmail(user, metrics) {
    try {
        const month = new Date().toLocaleString("en-US", { month: "long" });
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
            monthly: {
                month,
            },
            metrics: {
                total_reconciliations: metrics.totalReconciliations,
                accuracy: metrics.accuracy,
                time_saved: metrics.timeSaved,
                jobs_created: metrics.jobsCreated,
            },
            recommendations: {
                ...(metrics.topInsight1 && { top_insight_1: metrics.topInsight1 }),
                ...(metrics.topInsight2 && { top_insight_2: metrics.topInsight2 }),
                ...(metrics.recommendation1 && { recommendation_1: metrics.recommendation1 }),
                ...(metrics.recommendation2 && { recommendation_2: metrics.recommendation2 }),
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("monthly_summary", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: `${user.firstName || "You"}, your ${month} summary`,
            html,
            text,
            tags: [{ name: "email_type", value: "monthly_summary" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send monthly summary email", error, { user: user.email });
        return null;
    }
}
/**
 * Send low activity nudge email
 */
async function sendLowActivityEmail(user) {
    try {
        const firstName = user.firstName || user.email.split("@")[0] || "User";
        const data = {
            user: {
                first_name: firstName,
                email: user.email,
            },
        };
        const html = await (0, email_templates_1.renderEmailTemplate)("low_activity", data);
        const text = (0, email_templates_1.generatePlainText)(html);
        return (0, email_1.sendEmail)({
            to: user.email,
            subject: `${user.firstName || "We"} miss you`,
            html,
            text,
            tags: [{ name: "email_type", value: "low_activity" }],
        });
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send low activity email", error, { user: user.email });
        return null;
    }
}
//# sourceMappingURL=email-lifecycle.js.map