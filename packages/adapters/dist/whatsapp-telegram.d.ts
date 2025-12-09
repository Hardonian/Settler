import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";
/**
 * WhatsApp Business + Telegram Messaging Adapter
 * Fetches payment data from WhatsApp Pay and Telegram Payments
 */
export declare class WhatsAppTelegramAdapter implements Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    fetchWhatsAppPayments(_token: string, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<NormalizedData[]>;
    fetchTelegramPayments(_botToken: string, _dateRange?: {
        start: Date;
        end: Date;
    }): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=whatsapp-telegram.d.ts.map