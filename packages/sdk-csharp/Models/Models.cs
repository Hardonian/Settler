using System.Text.Json.Serialization;

namespace Settler.Sdk.Models;

public record Money(
    [property: JsonPropertyName("value")] decimal Value,
    [property: JsonPropertyName("currency")] string Currency
);

public record PaginationInfo(
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("limit")] int Limit,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("totalPages")] int TotalPages
);

public record Transaction(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("tenantId")] string TenantId,
    [property: JsonPropertyName("paymentId")] string PaymentId,
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("providerTransactionId")] string ProviderTransactionId,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("amount")] Money Amount,
    [property: JsonPropertyName("netAmount")] Money NetAmount,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("createdAt")] string CreatedAt,
    [property: JsonPropertyName("updatedAt")] string UpdatedAt
);

public record Settlement(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("tenantId")] string TenantId,
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("providerSettlementId")] string ProviderSettlementId,
    [property: JsonPropertyName("amount")] Money Amount,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("fxRate")] decimal? FxRate,
    [property: JsonPropertyName("settlementDate")] string? SettlementDate,
    [property: JsonPropertyName("expectedDate")] string? ExpectedDate,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("createdAt")] string CreatedAt,
    [property: JsonPropertyName("updatedAt")] string UpdatedAt
);

public record Fee(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("tenantId")] string TenantId,
    [property: JsonPropertyName("transactionId")] string TransactionId,
    [property: JsonPropertyName("settlementId")] string? SettlementId,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("amount")] Money Amount,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("rate")] decimal? Rate,
    [property: JsonPropertyName("createdAt")] string CreatedAt
);

public record EffectiveRateItem(
    [property: JsonPropertyName("transactionId")] string TransactionId,
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("transactionAmount")] decimal TransactionAmount,
    [property: JsonPropertyName("totalFees")] decimal TotalFees,
    [property: JsonPropertyName("effectiveRate")] decimal EffectiveRate
);

public record DateRange(
    [property: JsonPropertyName("start")] string Start,
    [property: JsonPropertyName("end")] string End
);

public record ExportOptions(
    [property: JsonPropertyName("includeFees")] bool? IncludeFees = true,
    [property: JsonPropertyName("includeUnmatched")] bool? IncludeUnmatched = false,
    [property: JsonPropertyName("includeRawPayloads")] bool? IncludeRawPayloads = false,
    [property: JsonPropertyName("columns")] string[]? Columns = null
);

public record ExportRequest(
    [property: JsonPropertyName("jobId")] string JobId,
    [property: JsonPropertyName("format")] string Format,
    [property: JsonPropertyName("dateRange")] DateRange DateRange,
    [property: JsonPropertyName("options")] ExportOptions? Options = null
);

public record ExportSummary(
    [property: JsonPropertyName("totalMatches")] int TotalMatches,
    [property: JsonPropertyName("totalUnmatched")] int TotalUnmatched,
    [property: JsonPropertyName("totalFees")] int TotalFees
);

public record ExportResult(
    [property: JsonPropertyName("exportDate")] string ExportDate,
    [property: JsonPropertyName("dateRange")] DateRange DateRange,
    [property: JsonPropertyName("summary")] ExportSummary Summary
);

public record ConversionResult(
    [property: JsonPropertyName("original")] Money Original,
    [property: JsonPropertyName("converted")] Money Converted
);

public record FxRateResult(
    [property: JsonPropertyName("fromCurrency")] string FromCurrency,
    [property: JsonPropertyName("toCurrency")] string ToCurrency,
    [property: JsonPropertyName("rate")] decimal Rate,
    [property: JsonPropertyName("date")] string? Date
);

public record WebhookResult(
    [property: JsonPropertyName("processed")] bool Processed,
    [property: JsonPropertyName("events")] object[]? Events
);

public record JobOptions(
    [property: JsonPropertyName("autoReconcile")] bool? AutoReconcile = true,
    [property: JsonPropertyName("notifyOnComplete")] bool? NotifyOnComplete = false
);

public record CreateJobRequest(
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("dateRange")] DateRange DateRange,
    [property: JsonPropertyName("options")] JobOptions? Options = null
);

public record JobResult(
    [property: JsonPropertyName("matched")] int Matched,
    [property: JsonPropertyName("unmatched")] int Unmatched,
    [property: JsonPropertyName("totalProcessed")] int TotalProcessed
);

public record Job(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("tenantId")] string TenantId,
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("dateRange")] DateRange DateRange,
    [property: JsonPropertyName("result")] JobResult? Result,
    [property: JsonPropertyName("createdAt")] string CreatedAt,
    [property: JsonPropertyName("updatedAt")] string UpdatedAt
);

public record ReportSummary(
    [property: JsonPropertyName("totalTransactions")] int TotalTransactions,
    [property: JsonPropertyName("matched")] int Matched,
    [property: JsonPropertyName("unmatched")] int Unmatched,
    [property: JsonPropertyName("totalAmount")] Money? TotalAmount,
    [property: JsonPropertyName("totalFees")] Money? TotalFees
);

public record Report(
    [property: JsonPropertyName("jobId")] string JobId,
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("dateRange")] DateRange DateRange,
    [property: JsonPropertyName("summary")] ReportSummary Summary,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("createdAt")] string CreatedAt
);

// Generic response wrappers
public record DataResponse<T>([property: JsonPropertyName("data")] T Data);

public record PaginatedResponse<T>(
    [property: JsonPropertyName("data")] T[] Data,
    [property: JsonPropertyName("pagination")] PaginationInfo Pagination
);
