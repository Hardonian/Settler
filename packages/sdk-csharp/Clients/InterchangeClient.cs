using System.Text.Json.Serialization;

namespace Settler.Sdk;

/// <summary>Client for interchange and fee optimization operations.</summary>
public sealed class InterchangeClient
{
    private readonly SettlerClient _client;

    internal InterchangeClient(SettlerClient client) => _client = client;

    /// <summary>Fetch interchange benchmark rates.</summary>
    public async Task<Dictionary<string, object>> GetRatesAsync(
        string rail, string? cardTier = null, CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string> { ["rail"] = rail };
        if (!string.IsNullOrEmpty(cardTier))
        {
            query["cardTier"] = cardTier;
        }

        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Get, "interchange/rates", query: query, cancellationToken: cancellationToken);
    }

    /// <summary>Analyze transaction fee breakdowns against interchange schedules.</summary>
    public async Task<Dictionary<string, object>> AnalyzeAsync(
        IEnumerable<object> transactions, CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["transactions"] = transactions,
        };

        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Post, "interchange/analyze", body: body, cancellationToken: cancellationToken);
    }

    /// <summary>Fetch tenant interchange portfolio optimization metrics.</summary>
    public async Task<Dictionary<string, object>> GetPortfolioAsync(
        string? tenantId = null, CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>();
        if (!string.IsNullOrEmpty(tenantId))
        {
            query["tenantId"] = tenantId;
        }

        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Get, "interchange/portfolio", query: query, cancellationToken: cancellationToken);
    }

    /// <summary>Synthesize Level 2/3 line-item and tax data for B2B card qualification.</summary>
    public async Task<Dictionary<string, object>> EnrichL3Async(
        IEnumerable<object> transactions, CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["transactions"] = transactions,
        };

        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Post, "interchange/enrich-l3", body: body, cancellationToken: cancellationToken);
    }
}
