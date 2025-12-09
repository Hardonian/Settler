/**
 * Receipt Parser
 * 
 * Parses OCR text into normalized receipt structure.
 * Uses rule-based heuristics to extract vendor, date, totals, items, etc.
 */

import { NormalizedReceipt, NormalizedReceiptItem, ReceiptParseResult } from './types';

/**
 * Parse receipt text into normalized structure
 */
export function parseReceiptFromText(text: string): ReceiptParseResult {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const receipt: NormalizedReceipt = {
    vendor: null,
    date: null,
    currency: 'USD',
    subtotal: null,
    tax: null,
    total: null,
    paymentMethod: null,
    items: [],
  };

  let confidenceScore = 0.5; // Base confidence
  let foundTotal = false;
  let foundItems = false;

  // Extract vendor (usually first line or contains "STORE", "SHOP", etc.)
  for (const line of lines.slice(0, 3)) {
    if (line.match(/STORE|SHOP|MARKET|GROCERY|RESTAURANT/i)) {
      receipt.vendor = line.replace(/STORE NAME:|^[^:]*:\s*/i, '').trim();
      confidenceScore += 0.1;
      break;
    }
  }
  if (!receipt.vendor && lines.length > 0) {
    receipt.vendor = lines[0];
  }

  // Extract date
  for (const line of lines) {
    const dateMatch = line.match(/(\d{4}[-/]\d{2}[-/]\d{2})|(\d{2}[-/]\d{2}[-/]\d{4})/);
    if (dateMatch) {
      try {
        receipt.date = new Date(dateMatch[0]);
        if (!isNaN(receipt.date.getTime())) {
          confidenceScore += 0.1;
          break;
        }
      } catch {
        // Invalid date, continue
      }
    }
  }

  // Extract currency
  const currencyMatch = text.match(/\$|USD|EUR|GBP|JPY/);
  if (currencyMatch) {
    if (currencyMatch[0] === '$') {
      receipt.currency = 'USD';
    } else {
      receipt.currency = currencyMatch[0];
    }
  }

  // Extract items (lines with quantities and prices)
  const itemPattern = /(\d+(?:\.\d+)?)\s*x\s*(.+?)\s+(\$?\d+\.\d{2})/i;
  const simpleItemPattern = /(.+?)\s+(\$?\d+\.\d{2})/;
  
  for (const line of lines) {
    if (line.match(/^Items?:/i)) {
      foundItems = true;
      continue;
    }
    
    if (foundItems && !line.match(/Subtotal|Tax|Total|Payment/i)) {
      let item: NormalizedReceiptItem | null = null;
      
      const itemMatch = line.match(itemPattern);
      if (itemMatch) {
        item = {
          name: itemMatch[2].trim(),
          quantity: parseFloat(itemMatch[1]),
          unitPrice: parseFloat(itemMatch[3].replace('$', '')),
          lineTotal: null,
          category: null,
        };
        item.lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      } else {
        const simpleMatch = line.match(simpleItemPattern);
        if (simpleMatch) {
          item = {
            name: simpleMatch[1].trim(),
            quantity: null,
            unitPrice: null,
            lineTotal: parseFloat(simpleMatch[2].replace('$', '')),
            category: null,
          };
        }
      }
      
      if (item) {
        receipt.items.push(item);
        confidenceScore += 0.05;
      }
    }
  }

  // Extract totals
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('subtotal')) {
      const amountMatch = line.match(/\$?(\d+\.\d{2})/);
      if (amountMatch) {
        receipt.subtotal = parseFloat(amountMatch[1]);
        confidenceScore += 0.1;
      }
    }
    
    if (lowerLine.includes('tax')) {
      const amountMatch = line.match(/\$?(\d+\.\d{2})/);
      if (amountMatch) {
        receipt.tax = parseFloat(amountMatch[1]);
        confidenceScore += 0.1;
      }
    }
    
    if (lowerLine.includes('total') && !lowerLine.includes('subtotal')) {
      const amountMatch = line.match(/\$?(\d+\.\d{2})/);
      if (amountMatch) {
        receipt.total = parseFloat(amountMatch[1]);
        foundTotal = true;
        confidenceScore += 0.15;
      }
    }
    
    if (lowerLine.includes('payment')) {
      const methodMatch = line.match(/payment[:\s]+(.+)/i);
      if (methodMatch) {
        receipt.paymentMethod = methodMatch[1].trim();
        confidenceScore += 0.05;
      }
    }
  }

  // Normalize confidence score (0.0 to 1.0)
  const normalizedConfidence = Math.min(1.0, Math.max(0.0, confidenceScore));

  return {
    receipt,
    confidenceScore: normalizedConfidence,
    rawText: text,
  };
}
