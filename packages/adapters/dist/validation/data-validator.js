"use strict";
/**
 * Enhanced Data Validation
 *
 * Validates normalized data before storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = exports.DataValidator = void 0;
class DataValidator {
    /**
     * Validate transaction
     */
    validateTransaction(tx) {
        const errors = [];
        const warnings = [];
        // Required fields
        if (!tx.externalId || tx.externalId.trim() === "") {
            errors.push("Transaction externalId is required");
        }
        if (!tx.transactionType) {
            errors.push("Transaction type is required");
        }
        else if (!["debit", "credit", "transfer", "fee", "refund"].includes(tx.transactionType)) {
            errors.push(`Invalid transaction type: ${tx.transactionType}`);
        }
        if (tx.amountCents === undefined || tx.amountCents === null) {
            errors.push("Transaction amount is required");
        }
        else if (tx.amountCents < 0) {
            errors.push("Transaction amount cannot be negative");
        }
        else if (tx.amountCents > 1000000000000) {
            warnings.push("Transaction amount is unusually large (>$10M)");
        }
        if (!tx.currency || tx.currency.length !== 3) {
            errors.push("Transaction currency must be a valid 3-letter ISO code");
        }
        if (!tx.occurredAt || !(tx.occurredAt instanceof Date)) {
            errors.push("Transaction occurredAt must be a valid Date");
        }
        else {
            const now = new Date();
            const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
            if (tx.occurredAt > futureDate) {
                warnings.push("Transaction date is in the future");
            }
            const oldDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); // 10 years ago
            if (tx.occurredAt < oldDate) {
                warnings.push("Transaction date is very old (>10 years)");
            }
        }
        // Sanity checks
        if (tx.description && tx.description.length > 1000) {
            warnings.push("Transaction description is very long (>1000 chars)");
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate account
     */
    validateAccount(account) {
        const errors = [];
        const warnings = [];
        if (!account.providerAccountId || account.providerAccountId.trim() === "") {
            errors.push("Account providerAccountId is required");
        }
        if (!account.accountName || account.accountName.trim() === "") {
            errors.push("Account name is required");
        }
        if (!account.currency || account.currency.length !== 3) {
            errors.push("Account currency must be a valid 3-letter ISO code");
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate balance
     */
    validateBalance(balance) {
        const errors = [];
        const warnings = [];
        if (balance.balanceCents === undefined || balance.balanceCents === null) {
            errors.push("Balance amount is required");
        }
        if (balance.availableBalanceCents !== undefined && balance.availableBalanceCents < 0) {
            warnings.push("Available balance is negative");
        }
        if (balance.availableBalanceCents !== undefined &&
            balance.availableBalanceCents > balance.balanceCents) {
            warnings.push("Available balance exceeds total balance");
        }
        if (!balance.currency || balance.currency.length !== 3) {
            errors.push("Balance currency must be a valid 3-letter ISO code");
        }
        if (!balance.snapshotAt || !(balance.snapshotAt instanceof Date)) {
            errors.push("Balance snapshotAt must be a valid Date");
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate payout
     */
    validatePayout(payout) {
        const errors = [];
        const warnings = [];
        if (!payout.externalId || payout.externalId.trim() === "") {
            errors.push("Payout externalId is required");
        }
        if (payout.amountCents === undefined || payout.amountCents === null) {
            errors.push("Payout amount is required");
        }
        else if (payout.amountCents <= 0) {
            errors.push("Payout amount must be positive");
        }
        if (!payout.currency || payout.currency.length !== 3) {
            errors.push("Payout currency must be a valid 3-letter ISO code");
        }
        if (!payout.status) {
            errors.push("Payout status is required");
        }
        else if (!["pending", "processing", "completed", "failed", "cancelled"].includes(payout.status)) {
            warnings.push(`Unusual payout status: ${payout.status}`);
        }
        if (!payout.initiatedAt || !(payout.initiatedAt instanceof Date)) {
            errors.push("Payout initiatedAt must be a valid Date");
        }
        if (payout.completedAt && payout.completedAt < payout.initiatedAt) {
            errors.push("Payout completedAt cannot be before initiatedAt");
        }
        if (payout.feeCents && payout.feeCents < 0) {
            warnings.push("Payout fee is negative");
        }
        if (payout.netAmountCents && payout.netAmountCents > payout.amountCents) {
            errors.push("Payout net amount cannot exceed gross amount");
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate invoice
     */
    validateInvoice(invoice) {
        const errors = [];
        const warnings = [];
        if (!invoice.externalId || invoice.externalId.trim() === "") {
            errors.push("Invoice externalId is required");
        }
        if (invoice.amountCents === undefined || invoice.amountCents === null) {
            errors.push("Invoice amount is required");
        }
        else if (invoice.amountCents < 0) {
            errors.push("Invoice amount cannot be negative");
        }
        if (!invoice.currency || invoice.currency.length !== 3) {
            errors.push("Invoice currency must be a valid 3-letter ISO code");
        }
        if (!invoice.status) {
            errors.push("Invoice status is required");
        }
        if (invoice.dueDate && invoice.issueDate && invoice.dueDate < invoice.issueDate) {
            errors.push("Invoice dueDate cannot be before issueDate");
        }
        // Validate line items
        if (invoice.lineItems) {
            let lineItemsTotal = 0;
            for (const item of invoice.lineItems) {
                if (item.quantity <= 0) {
                    warnings.push("Line item has non-positive quantity");
                }
                if (item.unitPriceCents < 0) {
                    warnings.push("Line item has negative unit price");
                }
                lineItemsTotal += item.totalCents || 0;
            }
            const tolerance = invoice.amountCents * 0.01; // 1% tolerance
            if (Math.abs(lineItemsTotal - invoice.amountCents) > tolerance) {
                warnings.push(`Line items total (${lineItemsTotal}) doesn't match invoice amount (${invoice.amountCents})`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate subscription
     */
    validateSubscription(subscription) {
        const errors = [];
        const warnings = [];
        if (!subscription.externalId || subscription.externalId.trim() === "") {
            errors.push("Subscription externalId is required");
        }
        if (!subscription.customerId || subscription.customerId.trim() === "") {
            errors.push("Subscription customerId is required");
        }
        if (subscription.amountCents === undefined || subscription.amountCents === null) {
            errors.push("Subscription amount is required");
        }
        else if (subscription.amountCents < 0) {
            errors.push("Subscription amount cannot be negative");
        }
        if (!subscription.currency || subscription.currency.length !== 3) {
            errors.push("Subscription currency must be a valid 3-letter ISO code");
        }
        if (!subscription.status) {
            errors.push("Subscription status is required");
        }
        if (subscription.currentPeriodEnd &&
            subscription.currentPeriodStart &&
            subscription.currentPeriodEnd < subscription.currentPeriodStart) {
            errors.push("Subscription period end cannot be before period start");
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate tax estimate
     */
    validateTaxEstimate(tax) {
        const errors = [];
        const warnings = [];
        if (!tax.externalId || tax.externalId.trim() === "") {
            errors.push("Tax estimate externalId is required");
        }
        if (tax.amountCents === undefined || tax.amountCents === null) {
            errors.push("Tax estimate amount is required");
        }
        else if (tax.amountCents < 0) {
            errors.push("Tax estimate amount cannot be negative");
        }
        if (tax.taxAmountCents === undefined || tax.taxAmountCents === null) {
            errors.push("Tax estimate taxAmount is required");
        }
        else if (tax.taxAmountCents < 0) {
            errors.push("Tax estimate taxAmount cannot be negative");
        }
        if (tax.taxAmountCents > tax.amountCents) {
            warnings.push("Tax amount exceeds transaction amount");
        }
        if (tax.taxRate !== undefined && (tax.taxRate < 0 || tax.taxRate > 1)) {
            warnings.push("Tax rate is outside normal range (0-100%)");
        }
        if (!tax.currency || tax.currency.length !== 3) {
            errors.push("Tax estimate currency must be a valid 3-letter ISO code");
        }
        if (!tax.occurredAt || !(tax.occurredAt instanceof Date)) {
            errors.push("Tax estimate occurredAt must be a valid Date");
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate all data types
     */
    validateAll(data) {
        const allErrors = [];
        const allWarnings = [];
        const counts = {
            transactions: { valid: 0, invalid: 0 },
            accounts: { valid: 0, invalid: 0 },
            balances: { valid: 0, invalid: 0 },
            payouts: { valid: 0, invalid: 0 },
            invoices: { valid: 0, invalid: 0 },
            subscriptions: { valid: 0, invalid: 0 },
            taxEstimates: { valid: 0, invalid: 0 },
        };
        if (data.transactions) {
            for (const tx of data.transactions) {
                const result = this.validateTransaction(tx);
                if (result.valid) {
                    counts.transactions.valid++;
                }
                else {
                    counts.transactions.invalid++;
                    allErrors.push(...result.errors.map((e) => `Transaction ${tx.externalId}: ${e}`));
                }
                allWarnings.push(...result.warnings.map((w) => `Transaction ${tx.externalId}: ${w}`));
            }
        }
        if (data.accounts) {
            for (const acc of data.accounts) {
                const result = this.validateAccount(acc);
                if (result.valid) {
                    counts.accounts.valid++;
                }
                else {
                    counts.accounts.invalid++;
                    allErrors.push(...result.errors.map((e) => `Account ${acc.providerAccountId}: ${e}`));
                }
                allWarnings.push(...result.warnings.map((w) => `Account ${acc.providerAccountId}: ${w}`));
            }
        }
        if (data.balances) {
            for (const bal of data.balances) {
                const result = this.validateBalance(bal);
                if (result.valid) {
                    counts.balances.valid++;
                }
                else {
                    counts.balances.invalid++;
                    allErrors.push("Balance validation error");
                }
                allWarnings.push(...result.warnings);
            }
        }
        if (data.payouts) {
            for (const payout of data.payouts) {
                const result = this.validatePayout(payout);
                if (result.valid) {
                    counts.payouts.valid++;
                }
                else {
                    counts.payouts.invalid++;
                    allErrors.push(...result.errors.map((e) => `Payout ${payout.externalId}: ${e}`));
                }
                allWarnings.push(...result.warnings.map((w) => `Payout ${payout.externalId}: ${w}`));
            }
        }
        if (data.invoices) {
            for (const invoice of data.invoices) {
                const result = this.validateInvoice(invoice);
                if (result.valid) {
                    counts.invoices.valid++;
                }
                else {
                    counts.invoices.invalid++;
                    allErrors.push(...result.errors.map((e) => `Invoice ${invoice.externalId}: ${e}`));
                }
                allWarnings.push(...result.warnings.map((w) => `Invoice ${invoice.externalId}: ${w}`));
            }
        }
        if (data.subscriptions) {
            for (const sub of data.subscriptions) {
                const result = this.validateSubscription(sub);
                if (result.valid) {
                    counts.subscriptions.valid++;
                }
                else {
                    counts.subscriptions.invalid++;
                    allErrors.push(...result.errors.map((e) => `Subscription ${sub.externalId}: ${e}`));
                }
                allWarnings.push(...result.warnings.map((w) => `Subscription ${sub.externalId}: ${w}`));
            }
        }
        if (data.taxEstimates) {
            for (const tax of data.taxEstimates) {
                const result = this.validateTaxEstimate(tax);
                if (result.valid) {
                    counts.taxEstimates.valid++;
                }
                else {
                    counts.taxEstimates.invalid++;
                    allErrors.push(...result.errors.map((e) => `Tax ${tax.externalId}: ${e}`));
                }
                allWarnings.push(...result.warnings.map((w) => `Tax ${tax.externalId}: ${w}`));
            }
        }
        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings,
            counts,
        };
    }
}
exports.DataValidator = DataValidator;
exports.validator = new DataValidator();
//# sourceMappingURL=data-validator.js.map