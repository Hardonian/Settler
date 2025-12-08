/**
 * Fee Extraction Service
 * 
 * Automatically extracts, normalizes, and reports fee components per transaction
 * as specified in the Product & Technical Specification.
 */

import { Transaction, Fee, Money } from '@settler/types';

export interface FeeExtractionResult {
  fees: Fee[];
  totalFees: Money;
  effectiveRate: number; // Percentage
}

export class FeeExtractionService {
  /**
   * Extract fees from a transaction's raw payload
   */
  async extractFees(transaction: Transaction, tenantId: string): Promise<FeeExtractionResult> {
    const provider = transaction.provider;

    switch (provider) {
      case 'stripe':
        return this.extractStripeFees(transaction, tenantId);
      case 'paypal':
        return this.extractPayPalFees(transaction, tenantId);
      case 'square':
        return this.extractSquareFees(transaction, tenantId);
      default:
        return this.extractGenericFees(transaction, tenantId);
    }
  }

  /**
   * Extract Stripe fees
   */
  private extractStripeFees(transaction: Transaction, tenantId: string): FeeExtractionResult {
    const fees: Fee[] = [];
    const payload = transaction.rawPayload;

    // Stripe fee structure
    if (payload.balance_transaction) {
      const balanceTx = payload.balance_transaction;
      
      // Processing fee
      if (balanceTx.fee !== undefined) {
        fees.push({
          id: this.generateId(),
          tenantId,
          transactionId: transaction.id,
          type: 'processing',
          amount: {
            value: balanceTx.fee / 100, // Convert cents to dollars
            currency: transaction.amount.currency,
          },
          description: 'Stripe processing fee',
          rate: this.calculateRate(balanceTx.fee, transaction.amount.value * 100),
          rawPayload: balanceTx,
          createdAt: new Date(),
        });
      }

      // FX fee (if applicable)
      if (balanceTx.exchange_rate && balanceTx.exchange_rate !== 1) {
        const fxFee = this.calculateFXFee(transaction, balanceTx);
        if (fxFee) {
          fees.push({
            id: this.generateId(),
            tenantId,
            transactionId: transaction.id,
            type: 'fx',
            amount: fxFee,
            description: 'Stripe FX conversion fee',
            rawPayload: balanceTx,
            createdAt: new Date(),
          });
        }
      }
    }

    // Chargeback fee
    if (payload.disputed && payload.dispute) {
      fees.push({
        id: this.generateId(),
        tenantId,
        transactionId: transaction.id,
        type: 'chargeback',
        amount: {
          value: (payload.dispute.charge || 0) / 100,
          currency: transaction.amount.currency,
        },
        description: 'Stripe chargeback fee',
        rawPayload: payload.dispute,
        createdAt: new Date(),
      });
    }

    return this.calculateTotals(fees, transaction);
  }

  /**
   * Extract PayPal fees
   */
  private extractPayPalFees(transaction: Transaction, tenantId: string): FeeExtractionResult {
    const fees: Fee[] = [];
    const payload = transaction.rawPayload;

    // PayPal fee structure
    if (payload.transaction_fee) {
      const feeAmount = parseFloat(payload.transaction_fee.value || '0');
      const feeCurrency = payload.transaction_fee.currency || transaction.amount.currency;

      fees.push({
        id: this.generateId(),
        tenantId,
        transactionId: transaction.id,
        type: 'processing',
        amount: {
          value: feeAmount,
          currency: feeCurrency,
        },
        description: 'PayPal processing fee',
        rate: this.calculateRate(feeAmount, transaction.amount.value),
        rawPayload: payload.transaction_fee,
        createdAt: new Date(),
      });
    }

    // PayPal FX fee
    if (payload.exchange_rate && payload.exchange_rate !== 1) {
      const fxFee = this.calculatePayPalFXFee(transaction, payload);
      if (fxFee) {
        fees.push({
          id: this.generateId(),
          tenantId,
          transactionId: transaction.id,
          type: 'fx',
          amount: fxFee,
          description: 'PayPal FX conversion fee',
          rawPayload: payload,
          createdAt: new Date(),
        });
      }
    }

    return this.calculateTotals(fees, transaction);
  }

  /**
   * Extract Square fees
   */
  private extractSquareFees(transaction: Transaction, tenantId: string): FeeExtractionResult {
    const fees: Fee[] = [];
    const payload = transaction.rawPayload;

    // Square fee structure
    if (payload.processing_fee_money) {
      fees.push({
        id: this.generateId(),
        tenantId,
        transactionId: transaction.id,
        type: 'processing',
        amount: {
          value: parseFloat(payload.processing_fee_money.amount || '0') / 100,
          currency: payload.processing_fee_money.currency || transaction.amount.currency,
        },
        description: 'Square processing fee',
        rate: this.calculateRate(
          parseFloat(payload.processing_fee_money.amount || '0'),
          transaction.amount.value * 100
        ),
        rawPayload: payload.processing_fee_money,
        createdAt: new Date(),
      });
    }

    return this.calculateTotals(fees, transaction);
  }

  /**
   * Extract generic fees (fallback)
   */
  private extractGenericFees(transaction: Transaction, tenantId: string): FeeExtractionResult {
    const fees: Fee[] = [];
    const payload = transaction.rawPayload;

    // Try to find common fee fields
    const feeFields = ['fee', 'processing_fee', 'transaction_fee', 'service_fee'];
    
    for (const field of feeFields) {
      if (payload[field]) {
        const feeValue = typeof payload[field] === 'number' 
          ? payload[field] 
          : parseFloat(payload[field] || '0');

        if (feeValue > 0) {
          fees.push({
            id: this.generateId(),
            tenantId,
            transactionId: transaction.id,
            type: 'processing',
            amount: {
              value: feeValue,
              currency: transaction.amount.currency,
            },
            description: `Processing fee (${field})`,
            rawPayload: { [field]: payload[field] },
            createdAt: new Date(),
          });
        }
      }
    }

    return this.calculateTotals(fees, transaction);
  }

  /**
   * Calculate FX fee for Stripe
   */
  private calculateFXFee(transaction: Transaction, balanceTx: any): Money | null {
    // Stripe doesn't always explicitly show FX fees
    // This is a simplified calculation
    if (!balanceTx.exchange_rate || balanceTx.exchange_rate === 1) {
      return null;
    }

    // Estimate FX fee (typically 1-2% of transaction amount)
    const estimatedFXRate = 0.015; // 1.5%
    return {
      value: transaction.amount.value * estimatedFXRate,
      currency: transaction.amount.currency,
    };
  }

  /**
   * Calculate FX fee for PayPal
   */
  private calculatePayPalFXFee(transaction: Transaction, payload: any): Money | null {
    if (!payload.exchange_rate || payload.exchange_rate === 1) {
      return null;
    }

    // PayPal FX fee is typically 2.5% above mid-market rate
    const estimatedFXRate = 0.025;
    return {
      value: transaction.amount.value * estimatedFXRate,
      currency: transaction.amount.currency,
    };
  }

  /**
   * Calculate fee rate (percentage)
   */
  private calculateRate(feeAmount: number, transactionAmount: number): number {
    if (transactionAmount === 0) {
      return 0;
    }
    return (feeAmount / transactionAmount) * 100;
  }

  /**
   * Calculate totals and effective rate
   */
  private calculateTotals(fees: Fee[], transaction: Transaction): FeeExtractionResult {
    // Sum all fees in transaction currency
    let totalFeesValue = 0;
    const currency = transaction.amount.currency;

    for (const fee of fees) {
      if (fee.amount.currency === currency) {
        totalFeesValue += fee.amount.value;
      } else {
        // TODO: Convert fee to transaction currency using FX rate
        // For now, assume same currency
        totalFeesValue += fee.amount.value;
      }
    }

    const totalFees: Money = {
      value: totalFeesValue,
      currency,
    };

    // Calculate effective rate
    const effectiveRate = transaction.amount.value > 0
      ? (totalFeesValue / transaction.amount.value) * 100
      : 0;

    return {
      fees,
      totalFees,
      effectiveRate,
    };
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
