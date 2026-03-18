"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppTelegramAdapter = void 0;
/**
 * WhatsApp Business + Telegram Messaging Adapter
 * Fetches payment data from WhatsApp Pay and Telegram Payments
 */
class WhatsAppTelegramAdapter {
    name = "whatsapp-telegram";
    version = "1.0.0";
    async fetch(options) {
        const { config, dateRange } = options;
        const whatsappToken = config.whatsappToken;
        const telegramBotToken = config.telegramBotToken;
        if (!whatsappToken && !telegramBotToken) {
            throw new Error("WhatsApp token or Telegram bot token is required");
        }
        const results = [];
        // Fetch WhatsApp payments (if available)
        if (whatsappToken) {
            try {
                const whatsappPayments = await this.fetchWhatsAppPayments(whatsappToken, dateRange);
                results.push(...whatsappPayments);
            }
            catch (error) {
                console.error("Error fetching WhatsApp payments:", error);
            }
        }
        // Fetch Telegram payments (if available)
        if (telegramBotToken) {
            try {
                const telegramPayments = await this.fetchTelegramPayments(telegramBotToken, dateRange);
                results.push(...telegramPayments);
            }
            catch (error) {
                console.error("Error fetching Telegram payments:", error);
            }
        }
        return results;
    }
    async fetchWhatsAppPayments(_token, _dateRange) {
        // WhatsApp Business API doesn't have a direct payments endpoint
        // Payments are typically handled through payment links or external processors
        // This would integrate with payment link reconciliation
        // const url = `https://graph.facebook.com/v18.0/me/messages`;
        // In production, this would query payment link transactions
        // For now, return empty array as WhatsApp payments are typically processed externally
        return [];
    }
    async fetchTelegramPayments(_botToken, _dateRange) {
        // Telegram Bot API doesn't provide payment history directly
        // Payments are handled through Telegram Payments API
        // This would integrate with payment provider webhooks
        // In production, this would query payment provider for Telegram payment transactions
        // For now, return empty array
        return [];
    }
    normalize(data) {
        const payment = data;
        const result = {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency.toUpperCase(),
            date: new Date(payment.date),
            metadata: {
                platform: payment.platform,
                message_id: payment.message_id,
                payment_link_id: payment.payment_link_id,
                source: `${payment.platform}_messaging`,
            },
            sourceId: payment.id,
        };
        const refId = payment.payment_link_id || payment.message_id;
        if (refId) {
            result.referenceId = refId;
        }
        return result;
    }
    validate(data) {
        const errors = [];
        if (!data.id) {
            errors.push("ID is required");
        }
        if (data.amount <= 0) {
            errors.push("Amount must be greater than 0");
        }
        if (!data.currency) {
            errors.push("Currency is required");
        }
        if (!data.date) {
            errors.push("Date is required");
        }
        return errors.length === 0 ? { valid: true } : { valid: false, errors };
    }
}
exports.WhatsAppTelegramAdapter = WhatsAppTelegramAdapter;
//# sourceMappingURL=whatsapp-telegram.js.map