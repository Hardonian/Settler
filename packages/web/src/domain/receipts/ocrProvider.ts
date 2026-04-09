/**
 * OCR Provider Abstraction
 *
 * Defines interface for OCR providers and provides a stub implementation.
 * Can be extended with real providers (Google Vision, AWS Textract, etc.) via environment variables.
 */

import { OcrResult } from "./types";

export interface OcrProvider {
  extractText(imageData: Buffer | string, mimeType: string): Promise<OcrResult>;
}

/**
 * Stub OCR Provider (for development/testing)
 * Returns placeholder text that can be parsed for testing.
 */
class StubOcrProvider implements OcrProvider {
  async extractText(_imageData: Buffer | string, _mimeType: string): Promise<OcrResult> {
    // Return sample receipt text for testing
    return {
      text: `
STORE NAME: ACME GROCERY
Date: 2024-01-15
Time: 14:30

Items:
1x Apples         $2.99
2x Bread          $3.50
1x Milk           $4.99

Subtotal:        $11.48
Tax:             $0.92
Total:           $12.40

Payment: Credit Card
Thank you for shopping!
      `.trim(),
      confidence: 0.85,
    };
  }
}

/**
 * Get OCR provider based on environment configuration
 */
export function getOcrProvider(): OcrProvider {
  const providerType = process.env.RECEIPTS_OCR_PROVIDER || "stub";

  switch (providerType) {
    case "stub":
      return new StubOcrProvider();
    // Future providers:
    // case 'google-vision':
    //   return new GoogleVisionOcrProvider();
    // case 'aws-textract':
    //   return new AwsTextractOcrProvider();
    default:
      return new StubOcrProvider();
  }
}
