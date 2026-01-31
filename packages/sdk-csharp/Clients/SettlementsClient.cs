using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for settlement operations.</summary>
public sealed class SettlementsClient
{
    private readonly SettlerClient _client;

    internal SettlementsClient(SettlerClient client) => _client = client;

    /// <summary>List settlements with optional filtering.</summary>
    public async Task<PaginatedResponse<Settlement>> ListAsync(
        int? page = null, int? limit = null, string? provider = null,
        string? status = null, string? startDate = null, string? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>();
        if (page.HasValue) query["page"] = page.Value.ToString();
        if (limit.HasValue) query["limit"] = limit.Value.ToString();
        if (provider != null) query["provider"] = provider;
        if (status != null) query["status"] = status;
        if (startDate != null) query["startDate"] = startDate;
        if (endDate != null) query["endDate"] = endDate;

        return await _client.RequestAsync<PaginatedResponse<Settlement>>(
            HttpMethod.Get, "settlements", query: query, cancellationToken: cancellationToken);
    }

    /// <summary>Get a settlement by ID.</summary>
    public async Task<DataResponse<Settlement>> GetAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Settlement>>(
            HttpMethod.Get, $"settlements/{Uri.EscapeDataString(id)}", cancellationToken: cancellationToken);
    }
}
