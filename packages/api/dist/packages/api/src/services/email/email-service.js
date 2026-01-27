"use strict";
/**
 * Email Service
 * Handles sending emails via configured provider (Resend/SendGrid)
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
exports.sendEmail = sendEmail;
exports.renderEmailTemplate = renderEmailTemplate;
const logger_1 = require("../../utils/logger");
/**
 * Send email via configured provider
 * Currently supports Resend (default) or SendGrid
 */
async function sendEmail(options) {
    try {
        const emailProvider = process.env.EMAIL_PROVIDER || "resend";
        const fromEmail = options.from || process.env.EMAIL_FROM || "noreply@settler.dev";
        if (emailProvider === "resend") {
            return await sendViaResend({
                ...options,
                from: fromEmail,
            });
        }
        else if (emailProvider === "sendgrid") {
            return await sendViaSendGrid({
                ...options,
                from: fromEmail,
            });
        }
        else {
            (0, logger_1.logError)("Unsupported email provider", new Error(`Provider: ${emailProvider}`));
            return false;
        }
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send email", error, { to: options.to, subject: options.subject });
        return false;
    }
}
async function loadResendModule() {
    return Promise.resolve().then(() => __importStar(require('resend'))).catch((error) => {
        (0, logger_1.logError)('Resend SDK not available', error);
        return null;
    });
}
async function loadSendGridModule() {
    return Promise.resolve().then(() => __importStar(require('@sendgrid/mail'))).catch((error) => {
        (0, logger_1.logError)('SendGrid SDK not available', error);
        return null;
    });
}
/**
 * Send email via Resend
 */
async function sendViaResend(options) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        (0, logger_1.logError)("Resend API key not configured", new Error("Missing RESEND_API_KEY"));
        return false;
    }
    // Dynamic import to avoid requiring Resend in package.json if not used
    const resendModule = await loadResendModule();
    if (!resendModule) {
        return false;
    }
    const { Resend } = resendModule;
    const resend = new Resend(apiKey);
    try {
        const emailData = {
            from: options.from,
            to: options.to,
            subject: options.subject,
            text: options.text || "",
        };
        if (options.html) {
            emailData.html = options.html;
        }
        if (options.replyTo) {
            emailData.reply_to = options.replyTo;
        }
        const result = await resend.emails.send(emailData);
        if (result.error) {
            (0, logger_1.logError)("Resend API error", new Error(result.error.message), {
                to: options.to,
                subject: options.subject,
            });
            return false;
        }
        (0, logger_1.logInfo)("Email sent via Resend", {
            to: options.to,
            subject: options.subject,
            id: result.data?.id,
        });
        return true;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send email via Resend", error, {
            to: options.to,
            subject: options.subject,
        });
        return false;
    }
}
/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(options) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
        (0, logger_1.logError)("SendGrid API key not configured", new Error("Missing SENDGRID_API_KEY"));
        return false;
    }
    // Dynamic import to avoid requiring SendGrid in package.json if not used
    // Note: @sendgrid/mail types may not be available
    const sgMailModule = await loadSendGridModule();
    if (!sgMailModule) {
        return false;
    }
    const sgMail = "default" in sgMailModule ? sgMailModule.default : sgMailModule;
    try {
        sgMail.setApiKey(apiKey);
        const msg = {
            to: options.to,
            from: options.from,
            subject: options.subject,
            text: options.text || "",
            html: options.html,
            replyTo: options.replyTo,
        };
        await sgMail.send(msg);
        (0, logger_1.logInfo)("Email sent via SendGrid", {
            to: options.to,
            subject: options.subject,
        });
        return true;
    }
    catch (error) {
        (0, logger_1.logError)("Failed to send email via SendGrid", error, {
            to: options.to,
            subject: options.subject,
        });
        return false;
    }
}
/**
 * Render email template with variables
 */
function renderEmailTemplate(template, variables) {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        rendered = rendered.replace(regex, String(value));
    }
    return rendered;
}
//# sourceMappingURL=email-service.js.map