using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for export operations.</summary>
public sealed class ExportsClient
{
    private readonly SettlerClient _client;

    internal ExportsClient(SettlerClient client) => _client = client;

    /// <summary>Create an export of reconciled data.</summary>
    public async Task<ExportResult> CreateAsync(ExportRequest request, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<ExportResult>(
            HttpMethod.Post, "exports", body: request, cancellationToken: cancellationToken);
    }
}
