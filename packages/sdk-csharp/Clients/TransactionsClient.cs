using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for transaction operations.</summary>
public sealed class TransactionsClient
{
    private readonly SettlerClient _client;

    internal TransactionsClient(SettlerClient client) => _client = client;

    /// <summary>List transactions with optional filtering.</summary>
    public async Task<PaginatedResponse<Transaction>> ListAsync(
        int? page = null, int? limit = null, string? provider = null,
        string? status = null, string? type = null, string? paymentId = null,
        string? startDate = null, string? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>();
        if (page.HasValue) query["page"] = page.Value.ToString();
        if (limit.HasValue) query["limit"] = limit.Value.ToString();
        if (provider != null) query["provider"] = provider;
        if (status != null) query["status"] = status;
        if (type != null) query["type"] = type;
        if (paymentId != null) query["paymentId"] = paymentId;
        if (startDate != null) query["startDate"] = startDate;
        if (endDate != null) query["endDate"] = endDate;

        return await _client.RequestAsync<PaginatedResponse<Transaction>>(
            HttpMethod.Get, "transactions", query: query, cancellationToken: cancellationToken);
    }

    /// <summary>Get a transaction by ID.</summary>
    public async Task<DataResponse<Transaction>> GetAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Transaction>>(
            HttpMethod.Get, $"transactions/{Uri.EscapeDataString(id)}", cancellationToken: cancellationToken);
    }
}
