/**
 * Webhook signature verification utility
 * Works in both Node.js and browser environments
 */
/**
 * Verifies a webhook signature using HMAC-SHA256
 *
 * @param payload - The raw request body (as string or Buffer)
 * @param signature - The signature from the X-Settler-Signature header
 * @param secret - Your webhook secret
 * @returns true if the signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyWebhookSignature(
 *   request.body,
 *   request.headers['x-settler-signature'],
 *   'your_webhook_secret'
 * );
 * ```
 */
export declare function verifyWebhookSignature(payload: string | Buffer | ArrayBuffer, signature: string, secret: string): boolean;
/**
 * Extracts the timestamp from a webhook signature header
 *
 * @param signature - The signature from the X-Settler-Signature header
 * @returns The timestamp in milliseconds, or null if not found
 */
export declare function extractWebhookTimestamp(signature: string): number | null;
/**
 * Verifies webhook signature and checks timestamp to prevent replay attacks
 *
 * @param payload - The raw request body
 * @param signature - The signature from the X-Settler-Signature header
 * @param secret - Your webhook secret
 * @param maxAge - Maximum age of the webhook in milliseconds (default: 5 minutes)
 * @returns true if valid and not expired, false otherwise
 */
export declare function verifyWebhookSignatureWithTimestamp(payload: string | Buffer | ArrayBuffer, signature: string, secret: string, maxAge?: number): boolean;
//# sourceMappingURL=webhook-signature.d.ts.map