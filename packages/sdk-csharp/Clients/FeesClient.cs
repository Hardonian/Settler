using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for fee operations.</summary>
public sealed class FeesClient
{
    private readonly SettlerClient _client;

    internal FeesClient(SettlerClient client) => _client = client;

    /// <summary>List fees with optional filtering.</summary>
    public async Task<DataResponse<Fee[]>> ListAsync(
        string? transactionId = null, string? settlementId = null, string? type = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>();
        if (transactionId != null) query["transactionId"] = transactionId;
        if (settlementId != null) query["settlementId"] = settlementId;
        if (type != null) query["type"] = type;

        return await _client.RequestAsync<DataResponse<Fee[]>>(
            HttpMethod.Get, "fees", query: query, cancellationToken: cancellationToken);
    }

    /// <summary>Calculate effective processing rate.</summary>
    public async Task<DataResponse<EffectiveRateItem[]>> GetEffectiveRateAsync(
        string? transactionId = null, string? provider = null,
        string? startDate = null, string? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>();
        if (transactionId != null) query["transactionId"] = transactionId;
        if (provider != null) query["provider"] = provider;
        if (startDate != null) query["startDate"] = startDate;
        if (endDate != null) query["endDate"] = endDate;

        return await _client.RequestAsync<DataResponse<EffectiveRateItem[]>>(
            HttpMethod.Get, "fees/effective-rate", query: query, cancellationToken: cancellationToken);
    }
}
