using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for reconciliation report operations.</summary>
public sealed class ReportsClient
{
    private readonly SettlerClient _client;

    internal ReportsClient(SettlerClient client) => _client = client;

    /// <summary>Get a reconciliation report for a job.</summary>
    public async Task<DataResponse<Report>> GetAsync(string jobId, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Report>>(
            HttpMethod.Get, $"reports/{Uri.EscapeDataString(jobId)}", cancellationToken: cancellationToken);
    }

    /// <summary>Get unmatched transactions for a job.</summary>
    public async Task<DataResponse<Transaction[]>> GetUnmatchedAsync(string jobId, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Transaction[]>>(
            HttpMethod.Get, $"reports/{Uri.EscapeDataString(jobId)}/unmatched", cancellationToken: cancellationToken);
    }
}
