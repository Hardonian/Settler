namespace Settler.Sdk;

/// <summary>Client for multi-rail settlement graph analysis.</summary>
public sealed class CrossRailClient
{
    private readonly SettlerClient _client;

    internal CrossRailClient(SettlerClient client) => _client = client;

    /// <summary>Analyze cross-rail transactions and bank sweeps for arbitrage and double-refunds.</summary>
    public async Task<Dictionary<string, object>> AnalyzeAsync(
        IEnumerable<object> transactions,
        IEnumerable<object>? bankSweeps = null,
        CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["transactions"] = transactions,
        };
        if (bankSweeps != null)
        {
            body["bankSweeps"] = bankSweeps;
        }

        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Post, "reconciliation/cross-rail", body: body, cancellationToken: cancellationToken);
    }
}
