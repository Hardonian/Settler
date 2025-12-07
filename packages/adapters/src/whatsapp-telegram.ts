import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

/**
 * WhatsApp Business + Telegram Messaging Adapter
 * Fetches payment data from WhatsApp Pay and Telegram Payments
 */
export class WhatsAppTelegramAdapter implements Adapter {
  name = "whatsapp-telegram";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config, dateRange } = options;
    const whatsappToken = config.whatsappToken as string;
    const telegramBotToken = config.telegramBotToken as string;

    if (!whatsappToken && !telegramBotToken) {
      throw new Error("WhatsApp token or Telegram bot token is required");
    }

    const results: NormalizedData[] = [];

    // Fetch WhatsApp payments (if available)
    if (whatsappToken) {
      try {
        const whatsappPayments = await this.fetchWhatsAppPayments(whatsappToken, dateRange);
        results.push(...whatsappPayments);
      } catch (error) {
        console.error("Error fetching WhatsApp payments:", error);
      }
    }

    // Fetch Telegram payments (if available)
    if (telegramBotToken) {
      try {
        const telegramPayments = await this.fetchTelegramPayments(telegramBotToken, dateRange);
        results.push(...telegramPayments);
      } catch (error) {
        console.error("Error fetching Telegram payments:", error);
      }
    }

    return results;
  }

  async fetchWhatsAppPayments(_token: string, _dateRange?: { start: Date; end: Date }): Promise<NormalizedData[]> {
    // WhatsApp Business API doesn't have a direct payments endpoint
    // Payments are typically handled through payment links or external processors
    // This would integrate with payment link reconciliation
    // const url = `https://graph.facebook.com/v18.0/me/messages`;
    
    // In production, this would query payment link transactions
    // For now, return empty array as WhatsApp payments are typically processed externally
    return [];
  }

  async fetchTelegramPayments(_botToken: string, _dateRange?: { start: Date; end: Date }): Promise<NormalizedData[]> {
    // Telegram Bot API doesn't provide payment history directly
    // Payments are handled through Telegram Payments API
    // This would integrate with payment provider webhooks
    
    // In production, this would query payment provider for Telegram payment transactions
    // For now, return empty array
    return [];
  }

  normalize(data: unknown): NormalizedData {
    const payment = data as {
      id: string;
      amount: number;
      currency: string;
      date: string;
      platform: "whatsapp" | "telegram";
      message_id?: string;
      payment_link_id?: string;
    };

    const result: NormalizedData = {
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

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

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

    return errors.length === 0
      ? { valid: true }
      : { valid: false, errors };
  }
}
