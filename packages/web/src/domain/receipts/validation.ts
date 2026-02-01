/**
 * Receipt Data Validation
 * 
 * Validates receipt data before saving to database.
 * Prevents malformed data and ensures data integrity.
 */

import { z } from 'zod';

/**
 * Receipt item validation schema
 */
export const receiptItemSchema = z.object({
  name: z.string().min(1).max(255),
  quantity: z.number().positive().optional().nullable(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  lineTotal: z.number().nonnegative().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

/**
 * Receipt validation schema
 */
export const receiptSchema = z.object({
  vendor: z.string().max(255).optional().nullable(),
  date: z.date().optional().nullable(),
  currency: z.string().length(3).optional().nullable(), // ISO 4217 currency code
  subtotal: z.number().nonnegative().optional().nullable(),
  tax: z.number().nonnegative().optional().nullable(),
  total: z.number().nonnegative().optional().nullable(),
  paymentMethod: z.string().max(100).optional().nullable(),
  confidenceScore: z.number().min(0).max(1).optional().nullable(),
  rawText: z.string().optional().nullable(),
  items: z.array(receiptItemSchema).default([]),
});

/**
 * Validate receipt data
 */
export function validateReceipt(data: unknown): {
  valid: boolean;
  errors?: z.ZodError;
  normalized?: z.infer<typeof receiptSchema>;
} {
  try {
    const result = receiptSchema.safeParse(data);
    
    if (result.success) {
      return {
        valid: true,
        normalized: result.data,
      };
    } else {
      return {
        valid: false,
        errors: result.error,
      };
    }
  } catch (_error) {
    return {
      valid: false,
      errors: error instanceof z.ZodError ? error : new z.ZodError([]),
    };
  }
}

/**
 * Sanitize receipt data (remove invalid fields, normalize values)
 */
export function sanitizeReceiptData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  // Vendor
  if (typeof data.vendor === 'string' && data.vendor.length > 0 && data.vendor.length <= 255) {
    sanitized.vendor = data.vendor.trim();
  }

  // Date
  if (data.date instanceof Date) {
    sanitized.date = data.date;
  } else if (typeof data.date === 'string') {
    const parsed = new Date(data.date);
    if (!isNaN(parsed.getTime())) {
      sanitized.date = parsed;
    }
  }

  // Currency (ISO 4217, 3 characters)
  if (typeof data.currency === 'string' && /^[A-Z]{3}$/.test(data.currency)) {
    sanitized.currency = data.currency.toUpperCase();
  }

  // Numeric fields
  const numericFields = ['subtotal', 'tax', 'total', 'confidenceScore'];
  for (const field of numericFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const num = typeof data[field] === 'string' ? parseFloat(data[field]) : Number(data[field]);
      if (!isNaN(num) && num >= 0) {
        if (field === 'confidenceScore') {
          sanitized[field] = Math.min(1, Math.max(0, num));
        } else {
          sanitized[field] = num;
        }
      }
    }
  }

  // Payment method
  if (typeof data.paymentMethod === 'string' && data.paymentMethod.length > 0 && data.paymentMethod.length <= 100) {
    sanitized.paymentMethod = data.paymentMethod.trim();
  }

  // Raw text
  if (typeof data.rawText === 'string') {
    sanitized.rawText = data.rawText.substring(0, 10000); // Limit to 10KB
  }

  // Items
  if (Array.isArray(data.items)) {
    sanitized.items = data.items
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => {
        const sanitizedItem: Record<string, unknown> = {};
        
        if (typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 255) {
          sanitizedItem.name = item.name.trim();
        } else {
          return null; // Invalid item
        }

        const numericItemFields = ['quantity', 'unitPrice', 'lineTotal'];
        for (const field of numericItemFields) {
          if (item[field] !== undefined && item[field] !== null) {
            const num = typeof item[field] === 'string' ? parseFloat(item[field]) : Number(item[field]);
            if (!isNaN(num) && num >= 0) {
              sanitizedItem[field] = num;
            }
          }
        }

        if (typeof item.category === 'string' && item.category.length <= 100) {
          sanitizedItem.category = item.category.trim();
        }

        return sanitizedItem;
      })
      .filter((item): item is Record<string, unknown> => item !== null);
  }

  return sanitized;
}

/**
 * Validate receipt totals (business logic validation)
 */
export function validateReceiptTotals(receipt: {
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  items?: Array<{ lineTotal?: number | null }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // If we have items, sum of line totals should approximately equal subtotal
  if (receipt.items && receipt.items.length > 0 && receipt.subtotal !== null && receipt.subtotal !== undefined) {
    const itemsTotal = receipt.items.reduce((sum: number, item: any) => {
      return sum + (item.lineTotal || 0);
    }, 0);

    const difference = Math.abs(itemsTotal - receipt.subtotal);
    const tolerance = receipt.subtotal * 0.01; // 1% tolerance

    if (difference > tolerance && difference > 0.01) {
      errors.push(`Items total (${itemsTotal}) does not match subtotal (${receipt.subtotal})`);
    }
  }

  // If we have subtotal and tax, they should sum to total
  if (
    receipt.subtotal !== null && receipt.subtotal !== undefined &&
    receipt.tax !== null && receipt.tax !== undefined &&
    receipt.total !== null && receipt.total !== undefined
  ) {
    const calculatedTotal = receipt.subtotal + receipt.tax;
    const difference = Math.abs(calculatedTotal - receipt.total);
    const tolerance = receipt.total * 0.01; // 1% tolerance

    if (difference > tolerance && difference > 0.01) {
      errors.push(`Subtotal + tax (${calculatedTotal}) does not match total (${receipt.total})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
